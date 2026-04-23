---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 了解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现 provider 运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-23T07:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7500ddc49feb828c65b0ec856aafdd53d52c965c32232bb518eb218f686ebf0
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参见：
  - [安装和使用插件](/zh-CN/tools/plugin) — 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) — 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) — 导入映射和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公开能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

| 能力                     | 注册方式                                         | 示例插件                             |
| ------------------------ | ------------------------------------------------ | ------------------------------------ |
| 文本推理                 | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推理后端             | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 语音                     | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 实时转录                 | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 实时语音                 | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒体理解                 | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 图像生成                 | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音乐生成                 | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 视频生成                 | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web 抓取                 | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 搜索                 | `api.registerWebSearchProvider(...)`             | `google`                             |
| 渠道 / 消息传递          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

一个注册了零种能力、但提供钩子、工具或服务的插件，是**仅钩子**插件。这种模式目前仍被完全支持。

### 外部兼容性立场

能力模型已经在核心中落地，并且当前已被内置 / 原生插件使用，但外部插件兼容性仍然需要比“它已导出，因此它已冻结”更严格的标准。

当前指导原则：

- **现有外部插件：** 保持基于钩子的集成继续可用；将其视为兼容性基线
- **新的内置 / 原生插件：** 优先使用显式能力注册，而不是依赖特定厂商的深入接入或新的仅钩子设计
- **采用能力注册的外部插件：** 允许，但除非文档明确将某个契约标记为稳定，否则应将能力相关的辅助接口视为仍在演进中

实际规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，旧式钩子仍然是对外部插件最安全、最不容易破坏兼容性的路径
- 已导出的辅助子路径并不全都同等稳定；优先使用文档化的狭义契约，而不是偶然暴露出的辅助导出

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其归类为一种形态：

- **plain-capability** —— 只注册一种能力类型（例如仅提供 provider 的插件，如 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** —— 仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册能力

使用 `openclaw plugins inspect <id>` 可以查看插件的形态和能力拆分。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧式钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容路径而被支持。现实中的旧插件仍然依赖它。

方向：

- 保持其可用
- 将其文档化为旧式能力
- 对于模型 / provider 覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降，并且夹具覆盖证明迁移安全后，才考虑移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号                     | 含义                                                         |
| ------------------------ | ------------------------------------------------------------ |
| **config valid**         | 配置可正常解析，插件可正常解析                               |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`）           |
| **legacy warning**       | 插件使用了 `before_agent_start`，该项已弃用                  |
| **hard error**           | 配置无效，或者插件加载失败                                   |

目前，`hook-only` 和 `before_agent_start` 都不会导致你的插件失效 —— `hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统分为四层：

1. **清单 + 发现**
   OpenClaw 会从配置路径、工作区根目录、全局插件根目录和内置插件中发现候选插件。发现流程会优先读取原生 `openclaw.plugin.json` 清单，以及受支持的 bundle 清单。
2. **启用 + 验证**
   核心决定某个已发现插件是启用、禁用、阻止，还是被选中用于某个排他槽位（例如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **表面消费**
   OpenClaw 的其余部分会读取注册表，以公开工具、渠道、provider 设置、钩子、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现专门分为两个阶段：

- 解析阶段元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持延迟加载，并在首次调用时注册

这样既能让插件自有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界：

- 发现 + 配置验证应该基于**清单 / schema 元数据**完成，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能够在完整运行时激活之前，完成配置验证、解释缺失 / 已禁用插件，并构建 UI / schema 提示。

### 渠道插件和共享消息工具

对于常规聊天操作，渠道插件无需单独注册发送 / 编辑 / 反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定发现和执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记以及执行分发
- 渠道插件拥有作用域内动作发现、能力发现，以及任何渠道特定的 schema 片段
- 渠道插件拥有 provider 特定的会话对话语法，例如对话 id 如何编码线程 id，或如何从父对话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口为 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件一起返回其可见动作、能力和 schema 贡献，从而避免这些部分发生漂移。

当某个渠道特定的消息工具参数携带媒体来源（例如本地路径或远程媒体 URL）时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而不需要硬编码插件自有的参数名。
这里应优先使用按动作划分的映射，而不是整个渠道范围的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 等无关动作中被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件很重要。渠道可以根据活动账户、当前房间 / 线程 / 消息，或受信任的请求者身份来隐藏或公开消息动作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，这样共享 `message` 工具才能为当前轮次公开正确的、由渠道拥有的表面。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再在 `src/agents/tools` 下拥有 Discord、Slack、Telegram 或 WhatsApp 的消息动作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从自己的扩展模块中导入本地运行时代码。

同样的边界也适用于一般意义上的按 provider 命名的 SDK 接缝：核心不应导入 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果核心需要某种行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中的狭义通用能力。

对投票而言，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是用于渠道特定投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才回退到共享投票解析，因此插件自有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动序列请参见 [加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为某个**公司**或某个**功能**的归属边界，而不是一个杂乱无章的无关集成集合。

这意味着：

- 公司插件通常应拥有该公司的所有面向 OpenClaw 的表面
- 功能插件通常应拥有它引入的完整功能表面
- 渠道应消费共享的核心能力，而不是临时重新实现 provider 行为

示例：

- 内置 `openai` 插件拥有 OpenAI 模型 provider 行为，以及 OpenAI 的语音、实时语音、媒体理解和图像生成行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置 `microsoft` 插件拥有 Microsoft 语音行为
- 内置 `google` 插件拥有 Google 模型 provider 行为，以及 Google 的媒体理解、图像生成和 Web 搜索行为
- 内置 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的媒体理解后端
- 内置 `qwen` 插件拥有 Qwen 文本 provider 行为，以及媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它会消费共享的语音、实时转录和实时语音能力，而不是直接导入厂商插件

预期的最终状态是：

- OpenAI 即使同时覆盖文本模型、语音、图像以及未来的视频能力，也仍然存在于一个插件中
- 其他厂商也可以对自己的表面区域采用相同方式
- 渠道并不关心哪个厂商插件拥有某个 provider；它们消费的是由核心公开的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 添加了一个新领域，例如视频，首先要问的不是“哪个 provider 应该硬编码视频处理？”。首先要问的是“核心的视频能力契约是什么？”。一旦这个契约存在，厂商插件就可以针对它进行注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式公开它
3. 让渠道 / 功能针对该能力完成接线
4. 让厂商插件注册实现

这样可以在保持归属明确的同时，避免核心行为依赖单一厂商或一次性的插件特定代码路径。

### 能力分层

在决定代码应放在哪里时，请使用以下心智模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费核心能力并在某个表面上呈现出来

例如，TTS 遵循以下形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先采用相同模式。

### 多能力公司插件示例

从外部看，公司插件应当是内聚的。如果 OpenClaw 拥有模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索的共享契约，那么某个厂商可以在一个地方拥有它的全部表面：

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

重要的不是具体的辅助函数名称。重要的是这种形态：

- 一个插件拥有厂商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一个共享能力。相同的归属模型也适用于这里：

1. 核心定义媒体理解契约
2. 厂商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是直接接入厂商代码

这样可以避免将某个 provider 对视频的假设固化进核心。插件拥有厂商表面；核心拥有能力契约和回退行为。

视频生成已经采用相同顺序：核心拥有类型化能力契约和运行时辅助工具，而厂商插件则注册 `api.registerVideoGenerationProvider(...)` 实现来对接该契约。

需要具体的发布检查清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约和约束

插件 API 表面被有意设计为类型化，并集中在
`OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可以依赖的运行时辅助工具。

这很重要，因为：

- 插件作者可以获得一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册同一个 provider id
- 启动时可以为格式错误的注册提供可操作的诊断信息
- 契约测试可以约束内置插件的归属，防止无声漂移

这里有两层约束：

1. **运行时注册约束**
   插件注册表会在插件加载时验证注册内容。例如：重复的 provider id、重复的语音 provider id，以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，这样 OpenClaw 就可以显式断言归属。目前这已用于模型 provider、语音 provider、Web 搜索 provider 和内置注册归属。

实际效果是，OpenClaw 能够预先知道哪个插件拥有哪个表面。这使得核心和渠道可以无缝组合，因为归属是声明式的、类型化的并且可测试，而不是隐式的。

### 什么应该属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力特定的
- 由核心拥有的
- 可被多个插件复用的
- 可被渠道 / 功能消费而无需了解厂商细节

不好的插件契约则是：

- 隐藏在核心中的厂商特定策略
- 绕过注册表的一次性插件逃生口
- 直接深入某个厂商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，请提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件会与 Gateway 网关**在同一进程内**运行。它们不是沙箱隔离的。已加载的原生插件与核心代码具有相同的进程级信任边界。

影响：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能会使 gateway 崩溃或变得不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将其视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。应将工作区插件视为开发期代码，而不是生产默认值。

对于内置工作区包名，保持插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包刻意公开较窄插件角色时，使用经批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果启用了 / 加入 allowlist 的工作区插件与某个内置插件具有相同 id，它会有意覆盖内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。
- 内置插件信任是根据加载时的源码快照解析的 —— 即磁盘上的清单和代码 —— 而不是根据安装元数据解析。损坏或被替换的安装记录无法在实际源码声明之外，悄悄扩大内置插件的信任表面。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利层。

保持能力注册为公开接口。收紧非契约辅助导出：

- 内置插件特定的辅助子路径
- 不打算作为公开 API 的运行时管线子路径
- 厂商特定的便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

出于兼容性和内置插件维护需要，某些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`，以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单及包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 jiti
7. 调用原生 `register(api)` 钩子，并将注册结果收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的旧别名 —— 加载器会解析两者中存在的那个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全闸门发生在**运行时代码执行之前**。当入口逃逸出插件根目录、路径对所有用户可写，或者对于非内置插件而言路径归属看起来可疑时，候选项会被阻止。

### Manifest-first 行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现已声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / 目录元数据
- 在不加载插件运行时的前提下保留轻量激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册真实行为，例如钩子、工具、命令或 provider 流程。

可选的清单 `activation` 和 `setup` 块仍然属于控制平面。它们只是用于激活规划和设置发现的纯元数据描述符；并不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活使用方现在会利用清单中的命令、渠道和 provider 提示，在更广泛的注册表实体化之前收窄插件加载范围：

- CLI 加载会收窄到拥有所请求主命令的插件
- 渠道设置 / 插件解析会收窄到拥有所请求渠道 id 的插件
- 显式 provider 设置 / 运行时解析会收窄到拥有所请求 provider id 的插件

设置发现现在会优先使用由描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以在回退到 `setup-api` 之前先收窄候选插件；`setup-api` 仅用于那些在设置阶段仍需要运行时钩子的插件。如果多个已发现插件声明了相同的规范化设置 provider 或 CLI 后端 id，则设置查找会拒绝这个有歧义的归属，而不是依赖发现顺序。

### 加载器会缓存什么

OpenClaw 会为以下内容保留短期的进程内缓存：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可以减少突发式启动开销和重复命令开销。可以放心将它们视为短生命周期的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 可使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存时间窗口。

## 注册表模型

已加载的插件不会直接修改核心中的任意全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、出处、状态、诊断）
- 工具
- 旧式钩子和类型化钩子
- 渠道
- providers
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

随后，核心功能会从该注册表读取信息，而不是直接与插件模块交互。这使得加载保持单向：

- 插件模块 -> 注册到注册表
- 核心运行时 -> 消费注册表

这种分离对可维护性非常重要。这意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“对每个插件模块做特殊分支处理”。

## 对话绑定回调

绑定对话的插件可以在审批结果解析后作出响应。

使用 `api.onConversationBindingResolved(...)` 可以在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：针对已批准请求解析出的绑定
- `request`：原始请求摘要、detach 提示、发送者 id 和对话元数据

这个回调仅用于通知。它不会改变谁有权绑定对话，并且它会在核心审批处理完成之后运行。

## provider 运行时钩子

provider 插件现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于在运行时加载前低成本查找 provider 的环境变量认证，`providerAuthAliases` 用于共享认证的 provider 变体，`channelEnvVars` 用于在运行时加载前低成本查找渠道环境变量 / 设置，此外还有 `providerAuthChoices`，用于在运行时加载前提供低成本的新手引导 / 认证选择标签和 CLI 标志元数据
- 配置时钩子：`catalog` / 旧式 `discovery`，以及 `applyConfigDefaults`
- 运行时钩子：`normalizeModelId`、`normalizeTransport`、
  `normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`resolveExternalAuthProfiles`、
  `shouldDeferSyntheticProfileAuth`、
  `resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、
  `contributeResolvedModelCompat`、`capabilities`、
  `normalizeToolSchemas`、`inspectToolSchemas`、
  `resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、
  `wrapStreamFn`、`resolveTransportTurnState`、
  `resolveWebSocketSessionPolicy`、`formatApiKey`、`refreshOAuth`、
  `buildAuthDoctorHint`、`matchesContextOverflowError`、
  `classifyFailoverReason`、`isCacheTtlEligible`、
  `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、
  `resolveThinkingProfile`、`isBinaryThinking`、`supportsXHighThinking`、
  `resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、
  `buildReplayPolicy`、
  `sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClaw 仍然拥有通用智能体循环、故障切换、转录处理和工具策略。这些钩子是在无需整套自定义推理传输的情况下，用于扩展 provider 特定行为的表面。

当 provider 具有基于环境变量的凭证，并且通用认证 / 状态 / 模型选择器路径需要在不加载插件运行时的情况下感知这些凭证时，请使用清单中的 `providerAuthEnvVars`。当某个 provider id 应复用另一个 provider id 的环境变量、认证配置文件、基于配置的认证以及 API key 新手引导选项时，请使用清单中的 `providerAuthAliases`。当新手引导 / 认证选择 CLI 表面需要在不加载 provider 运行时的情况下，知道该 provider 的 choice id、分组标签和简单的单标志认证接线时，请使用清单中的 `providerAuthChoices`。保留 provider 运行时 `envVars` 用于面向操作员的提示，例如新手引导标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有由环境变量驱动的认证或设置，并且通用 shell 环境变量回退、配置 / 状态检查或设置提示需要在不加载渠道运行时的情况下感知它时，请使用清单中的 `channelEnvVars`。

### 钩子顺序和用法

对于模型 / provider 插件，OpenClaw 大致按以下顺序调用这些钩子。
“何时使用”这一列是快速决策指南。

| #   | 钩子                              | 作用                                                                                                           | 何时使用                                                                                                                                      |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将 provider 配置发布到 `models.providers` 中                                       | provider 拥有目录或 base URL 默认值                                                                                                           |
| 2   | `applyConfigDefaults`             | 在配置实体化期间，应用 provider 自有的全局配置默认值                                                           | 默认值依赖于认证模式、环境变量或 provider 模型族语义                                                                                         |
| --  | _(内置模型查找)_                  | OpenClaw 会先尝试常规注册表 / 目录路径                                                                        | _(不是插件钩子)_                                                                                                                              |
| 3   | `normalizeModelId`                | 在查找前规范化旧式或预览版 model-id 别名                                                                      | provider 拥有在规范模型解析之前进行别名清理的逻辑                                                                                             |
| 4   | `normalizeTransport`              | 在通用模型组装之前，规范化 provider 族的 `api` / `baseUrl`                                                    | provider 拥有同一传输族中自定义 provider id 的传输清理逻辑                                                                                    |
| 5   | `normalizeConfig`                 | 在运行时 / provider 解析之前，规范化 `models.providers.<id>`                                                  | provider 需要将配置清理逻辑放在插件中；内置 Google 族辅助工具也会为受支持的 Google 配置项提供兜底                                           |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 providers 应用原生流式用量兼容性改写                                                                  | provider 需要基于端点驱动的原生流式用量元数据修复                                                                                             |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证之前，为配置 provider 解析 env-marker 认证                                                    | provider 拥有自己的 env-marker API key 解析逻辑；`amazon-bedrock` 在这里也有一个内置 AWS env-marker 解析器                                  |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下公开本地 / 自托管或基于配置的认证                                                       | provider 可以通过合成 / 本地凭证标记运行                                                                                                      |
| 9   | `resolveExternalAuthProfiles`     | 叠加 provider 自有的外部认证配置文件；对 CLI / 应用自有凭证，默认 `persistence` 为 `runtime-only`            | provider 会复用外部认证凭证，而不持久化复制的刷新令牌；需在清单中声明 `contracts.externalAuthProviders`                                     |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符优先级降到环境变量 / 基于配置的认证之后                                            | provider 会存储合成占位配置文件，而这些占位项不应获得更高优先级                                                                              |
| 11  | `resolveDynamicModel`             | 对本地注册表中尚不存在的 provider 自有 model id 执行同步回退解析                                               | provider 接受任意上游 model id                                                                                                                |
| 12  | `prepareDynamicModel`             | 异步预热，然后再次运行 `resolveDynamicModel`                                                                  | provider 在解析未知 id 之前需要网络元数据                                                                                                     |
| 13  | `normalizeResolvedModel`          | 在嵌入式 runner 使用已解析模型之前执行最终改写                                                                | provider 需要进行传输改写，但仍然使用核心传输                                                                                                |
| 14  | `contributeResolvedModelCompat`   | 为另一种兼容传输背后的厂商模型提供兼容性标志                                                                  | provider 能在不接管该 provider 的情况下，在代理传输上识别自己的模型                                                                          |
| 15  | `capabilities`                    | 由共享核心逻辑使用的 provider 自有转录 / 工具元数据                                                           | provider 需要处理转录 / provider 族特有差异                                                                                                  |
| 16  | `normalizeToolSchemas`            | 在嵌入式 runner 看到工具 schema 之前对其进行规范化                                                            | provider 需要进行传输族 schema 清理                                                                                                           |
| 17  | `inspectToolSchemas`              | 在规范化之后公开 provider 自有的 schema 诊断                                                                  | provider 希望提供关键字警告，而不必让核心了解 provider 特定规则                                                                              |
| 18  | `resolveReasoningOutputMode`      | 选择原生推理输出契约还是带标签的推理输出契约                                                                  | provider 需要使用带标签的推理 / 最终输出，而不是原生字段                                                                                    |
| 19  | `prepareExtraParams`              | 在通用流式选项包装器之前进行请求参数规范化                                                                    | provider 需要默认请求参数或按 provider 清理参数                                                                                              |
| 20  | `createStreamFn`                  | 使用自定义传输完全替换常规流路径                                                                              | provider 需要自定义线路协议，而不只是一个包装器                                                                                              |
| 21  | `wrapStreamFn`                    | 在应用通用包装器之后再包装流函数                                                                              | provider 需要请求头 / 请求体 / 模型兼容性包装器，而不是自定义传输                                                                            |
| 22  | `resolveTransportTurnState`       | 附加原生的按轮次传输请求头或元数据                                                                            | provider 希望通用传输发送 provider 原生轮次身份                                                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略                                                                       | provider 希望通用 WS 传输调优会话请求头或回退策略                                                                                            |
| 24  | `formatApiKey`                    | 认证配置文件格式化器：已存储配置文件会变成运行时 `apiKey` 字符串                                              | provider 会存储额外认证元数据，并需要自定义运行时令牌形态                                                                                    |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑                                                             | provider 不适配共享的 `pi-ai` 刷新器                                                                                                         |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时附加修复提示                                                                               | provider 在刷新失败后需要 provider 自有的认证修复指引                                                                                        |
| 27  | `matchesContextOverflowError`     | provider 自有的上下文窗口溢出匹配器                                                                           | provider 存在通用启发式无法识别的原始溢出错误                                                                                                |
| 28  | `classifyFailoverReason`          | provider 自有的故障切换原因分类                                                                               | provider 可以将原始 API / 传输错误映射为速率限制 / 过载 / 等                                                                                  |
| 29  | `isCacheTtlEligible`              | 面向代理 / 回传 provider 的提示词缓存策略                                                                     | provider 需要代理特定的缓存 TTL 门控                                                                                                         |
| 30  | `buildMissingAuthMessage`         | 替代通用缺失认证恢复消息                                                                                      | provider 需要 provider 特定的缺失认证恢复提示                                                                                                |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，并可附带面向用户的错误提示                                                                  | provider 需要隐藏过时的上游条目，或用厂商提示替换它们                                                                                        |
| 32  | `augmentModelCatalog`             | 在发现后附加合成 / 最终目录条目                                                                               | provider 需要在 `models list` 和选择器中补充合成的前向兼容条目                                                                               |
| 33  | `resolveThinkingProfile`          | 针对特定模型设置 `/think` 级别、显示标签和默认值                                                              | provider 为选定模型公开自定义 thinking 阶梯或二元标签                                                                                        |
| 34  | `isBinaryThinking`                | 开 / 关推理切换兼容性钩子                                                                                     | provider 仅公开二元的 thinking 开 / 关                                                                                                       |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子                                                                                    | provider 只希望在部分模型上支持 `xhigh`                                                                                                      |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子                                                                                  | provider 拥有某个模型族的默认 `/think` 策略                                                                                                  |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器                                                             | provider 拥有实时 / smoke 首选模型匹配逻辑                                                                                                   |
| 38  | `prepareRuntimeAuth`              | 在推理前，将已配置凭证交换为实际运行时令牌 / key                                                              | provider 需要令牌交换或短时效请求凭证                                                                                                        |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关状态表面解析用量 / 计费凭证                                                                 | provider 需要自定义用量 / 配额令牌解析，或使用不同的用量凭证                                                                                 |
| 40  | `fetchUsageSnapshot`              | 在认证解析后获取并规范化 provider 特定的用量 / 配额快照                                                       | provider 需要 provider 特定的用量端点或负载解析器                                                                                            |
| 41  | `createEmbeddingProvider`         | 为 memory / 搜索构建 provider 自有的 embedding 适配器                                                         | Memory embedding 行为应归属于 provider 插件                                                                                                  |
| 42  | `buildReplayPolicy`               | 返回一个控制该 provider 转录处理方式的回放策略                                                                | provider 需要自定义转录策略（例如剥离 thinking 块）                                                                                          |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理之后改写回放历史                                                                                 | provider 需要在共享压缩辅助工具之外，进一步执行 provider 特定的回放改写                                                                      |
| 44  | `validateReplayTurns`             | 在嵌入式 runner 之前，对回放轮次进行最终校验或重塑                                                            | provider 传输在通用净化之后需要更严格的轮次校验                                                                                              |
| 45  | `onModelSelected`                 | 在模型变为活动状态时运行 provider 自有的后续副作用                                                            | provider 在模型激活时需要遥测或 provider 自有状态                                                                                            |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的 provider 插件，然后再依次回退到其他具备钩子能力的 provider 插件，直到有某个插件真正改写 model id 或 transport / config。这样可以让别名 / 兼容 provider 垫片继续工作，而不要求调用方知道是哪个内置插件拥有该改写逻辑。如果没有任何 provider 钩子去改写受支持的 Google 族配置项，内置 Google 配置规范化器仍会执行该兼容性清理。

如果 provider 需要完全自定义的线路协议或自定义请求执行器，那属于另一类扩展。这些钩子适用于仍运行在 OpenClaw 常规推理循环上的 provider 行为。

### provider 示例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 内置示例

- Anthropic 使用 `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、
  `resolveThinkingProfile`、`applyConfigDefaults`、`isModernModelRef`
  和 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、provider 族提示、认证修复指引、用量端点集成、提示词缓存资格、具备认证感知的配置默认值、Claude 默认 / 自适应 thinking 策略，以及面向 beta 请求头、`/fast` / `serviceTier` 和 `context1m` 的 Anthropic 特定流整形。
- Anthropic 的 Claude 特定流辅助工具目前保留在内置插件自己的公开 `api.ts` / `contract-api.ts` 接缝中。该包表面导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的 Anthropic 包装器构建工具，而不是为了某个 provider 的 beta 请求头规则去扩大通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，再加上 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`resolveThinkingProfile` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接 OpenAI
  `openai-completions` -> `openai-responses` 规范化、具备 Codex 感知的认证提示、Spark 抑制、合成 OpenAI 列表行，以及 GPT-5 thinking / 实时模型策略；`openai-responses-defaults` 流族则拥有共享的原生 OpenAI Responses 包装器，用于处理 attribution 请求头、`/fast` / `serviceTier`、文本详细度、原生 Codex Web 搜索、推理兼容负载整形以及 Responses 上下文管理。
- OpenRouter 使用 `catalog`，以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该 provider 是透传型的，可能会在 OpenClaw 静态目录更新之前公开新的 model id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以将 provider 特定请求头、路由元数据、推理补丁和提示词缓存策略保留在核心之外。它的回放策略来自 `passthrough-gemini` 族，而 `openrouter-thinking` 流族拥有代理推理注入以及对不受支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，再加上 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，
  因为它需要 provider 自有的设备登录、模型回退行为、Claude 转录差异、GitHub token -> Copilot token 交换，以及 provider 自有的用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，
  再加上 `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，
  因为它仍运行在核心 OpenAI 传输之上，但拥有自己的传输 / base URL 规范化、OAuth 刷新回退策略、默认传输选择、合成 Codex 目录行，以及 ChatGPT 用量端点集成；它与直接 OpenAI 共享同一个 `openai-responses-defaults` 流族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` 回放族拥有 Gemini 3.1 前向兼容回退、原生 Gemini 回放校验、引导回放净化、带标签推理输出模式以及现代模型匹配，而
  `google-thinking` 流族拥有 Gemini thinking 负载规范化；Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理令牌格式化、令牌解析和配额端点接线。
- Anthropic Vertex 通过 `anthropic-by-model` 回放族使用 `buildReplayPolicy`，这样 Claude 特定的回放清理就只会作用于 Claude id，而不是每个 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveThinkingProfile`，因为它拥有面向 Bedrock 上 Anthropic 流量的 Bedrock 特定限流 / 未就绪 / 上下文溢出错误分类；它的回放策略仍共享同一个仅限 Claude 的 `anthropic-by-model` 守卫。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过
  `passthrough-gemini` 回放族使用 `buildReplayPolicy`，因为它们通过 OpenAI 兼容传输代理 Gemini 模型，并需要 Gemini
  thought-signature 净化，而不需要原生 Gemini 回放校验或引导改写。
- MiniMax 通过 `hybrid-anthropic-openai` 回放族使用 `buildReplayPolicy`，因为同一个 provider 同时拥有 Anthropic-message 和 OpenAI 兼容语义；它会在 Anthropic 一侧保留仅针对 Claude 的 thinking 块丢弃逻辑，同时将推理输出模式覆盖回原生，而 `minimax-fast-mode` 流族则在共享流路径上拥有 fast-mode 模型改写。
- Moonshot 使用 `catalog`、`resolveThinkingProfile` 和 `wrapStreamFn`，因为它仍使用共享
  OpenAI 传输，但需要 provider 自有的 thinking 负载规范化；`moonshot-thinking` 流族会将配置加 `/think` 状态映射到其原生的二元 thinking 负载。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要 provider 自有请求头、推理负载规范化、Gemini 转录提示和 Anthropic
  缓存 TTL 门控；`kilocode-thinking` 流族会在共享代理流路径上保留 Kilo thinking 注入，同时跳过 `kilo/auto` 和其他不支持显式推理负载的代理 model id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`resolveThinkingProfile`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking UX、现代模型匹配，以及用量认证和配额抓取；`tool-stream-default-on` 流族会将默认开启的 `tool_stream` 包装器保留在逐 provider 手写胶水代码之外。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode 别名改写、默认 `tool_stream`、严格工具 / 推理负载清理、面向插件自有工具的回退认证复用、前向兼容 Grok 模型解析，以及 provider 自有兼容性补丁，例如 xAI 工具 schema 配置文件、不受支持的 schema 关键字、原生 `web_search` 和 HTML 实体工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，以将转录 / 工具差异保留在核心之外。
- 仅目录型的内置 providers，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，仅使用 `catalog`。
- Qwen 为其文本 provider 使用 `catalog`，并为其多模态表面使用共享的媒体理解和视频生成注册。
- MiniMax 和 Xiaomi 同时使用 `catalog` 和用量钩子，因为它们的 `/usage`
  行为归插件所有，尽管推理仍通过共享传输运行。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分选定的核心辅助工具。对于 TTS：

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

说明：

- `textToSpeech` 返回用于文件 / 语音便笺表面的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和 provider 选择。
- 返回 PCM 音频缓冲区和采样率。插件必须为 providers 重新采样 / 编码。
- `listVoices` 对每个 provider 来说是可选的。可将其用于厂商自有语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以支持具备 provider 感知能力的选择器。
- 目前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音 providers。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

说明：

- 将 TTS 策略、回退和回复投递保留在核心中。
- 对于厂商自有的合成行为，请使用语音 providers。
- 旧式 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 推荐的归属模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个厂商插件可以拥有文本、语音、图像以及未来的媒体 providers。

对于图像 / 音频 / 视频理解，插件会注册一个类型化的媒体理解 provider，而不是注册一个通用键 / 值包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

说明：

- 将编排、回退、配置和渠道接线保留在核心中。
- 将厂商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
  - 核心拥有能力契约和运行时辅助工具
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能 / 渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助工具，插件可以调用：

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

对于音频转录，插件既可以使用媒体理解运行时，也可以使用旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当未产生转录输出时（例如输入被跳过 / 不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作为兼容性别名保留。

插件也可以通过 `api.runtime.subagent` 启动后台子智能体运行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

说明：

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久性的会话变更。
- OpenClaw 仅对受信任调用方生效这些覆盖字段。
- 对于插件自有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制到特定的规范 `provider/model` 目标，或设置为 `"*"` 以显式允许任意目标。
- 不受信任插件的子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是深入智能体工具接线：

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

插件也可以通过
`api.registerWebSearchProvider(...)` 注册 Web 搜索 providers。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在核心中。
- 对于厂商特定的搜索传输，请使用 Web 搜索 providers。
- `api.runtime.webSearch.*` 是功能 / 渠道插件在不依赖智能体工具包装器的情况下需要搜索行为时的首选共享表面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用已配置的图像生成 provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 providers 及其能力。

## Gateway 网关 HTTP 路由

插件可以通过 `api.registerHttpRoute(...)` 公开 HTTP 端点。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由字段：

- `path`：Gateway 网关 HTTP 服务器下的路由路径。
- `auth`：必填。使用 `"gateway"` 以要求普通 Gateway 网关认证，或使用 `"plugin"` 以使用插件管理的认证 / webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己已有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别内保留 `exact` / `prefix` 逐级回退链。
- `auth: "plugin"` 路由**不会**自动接收运维人员运行时作用域。它们用于插件管理的 webhook / 签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域是有意保守的：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 带有可信身份信息的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）只有在显式存在该请求头时才会遵循 `x-openclaw-scopes`
  - 如果这些带身份信息的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实际规则：不要假设一个经过 gateway 认证的插件路由天然就是管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用带身份信息的认证模式，并文档化显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写插件时，请使用 SDK 子路径，而不是整体式的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于插件注册原语。
- `openclaw/plugin-sdk/core` 用于通用共享的面向插件契约。
- `openclaw/plugin-sdk/config-schema` 用于根 `openclaw.json` Zod schema
  导出（`OpenClawSchema`）。
- 稳定的渠道原语，例如 `openclaw/plugin-sdk/channel-setup`、
  `openclaw/plugin-sdk/setup-runtime`、
  `openclaw/plugin-sdk/setup-adapter-runtime`、
  `openclaw/plugin-sdk/setup-tools`、
  `openclaw/plugin-sdk/channel-pairing`、
  `openclaw/plugin-sdk/channel-contract`、
  `openclaw/plugin-sdk/channel-feedback`、
  `openclaw/plugin-sdk/channel-inbound`、
  `openclaw/plugin-sdk/channel-lifecycle`、
  `openclaw/plugin-sdk/channel-reply-pipeline`、
  `openclaw/plugin-sdk/command-auth`、
  `openclaw/plugin-sdk/secret-input`，以及
  `openclaw/plugin-sdk/webhook-ingress`，用于共享设置 / 认证 / 回复 / webhook
  接线。`channel-inbound` 是去抖动、提及匹配、入站提及策略辅助工具、信封格式化和入站信封上下文辅助工具的共享归属位置。
  `channel-setup` 是狭义的可选安装设置接缝。
  `setup-runtime` 是由 `setupEntry` / 延迟启动使用的运行时安全设置表面，其中包括导入安全的设置补丁适配器。
  `setup-adapter-runtime` 是具备环境变量感知能力的账户设置适配器接缝。
  `setup-tools` 是小型 CLI / 归档 / 文档辅助工具接缝（`formatCliCommand`、
  `detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、
  `CONFIG_DIR`）。
- 领域子路径，例如 `openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
  `openclaw/plugin-sdk/approval-gateway-runtime`、
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`、
  `openclaw/plugin-sdk/approval-handler-runtime`、
  `openclaw/plugin-sdk/approval-runtime`、
  `openclaw/plugin-sdk/config-runtime`、
  `openclaw/plugin-sdk/infra-runtime`、
  `openclaw/plugin-sdk/agent-runtime`、
  `openclaw/plugin-sdk/lazy-runtime`、
  `openclaw/plugin-sdk/reply-history`、
  `openclaw/plugin-sdk/routing`、
  `openclaw/plugin-sdk/status-helpers`、
  `openclaw/plugin-sdk/text-runtime`、
  `openclaw/plugin-sdk/runtime-store`，以及
  `openclaw/plugin-sdk/directory-runtime`，用于共享运行时 / 配置辅助工具。
  `telegram-command-config` 是 Telegram 自定义命令规范化 / 校验的狭义公开接缝，即使内置 Telegram 契约表面暂时不可用，它也保持可用。
  `text-runtime` 是共享的文本 / Markdown / 日志接缝，包括对智能体可见文本的剥离、Markdown 渲染 / 分块辅助工具、脱敏辅助工具、指令标签辅助工具和安全文本工具。
- 与审批相关的渠道接缝应优先使用插件上的单一 `approvalCapability`
  契约。随后，核心会通过这一能力读取审批认证、投递、渲染、原生路由和惰性原生处理器行为，而不是把审批行为混入不相关的插件字段中。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，目前仅作为旧插件的兼容垫片保留。新代码应改为导入更狭义的通用原语，仓库代码也不应新增对该垫片的导入。
- 内置扩展内部实现仍然是私有的。外部插件应仅使用 `openclaw/plugin-sdk/*` 子路径。OpenClaw 核心 / 测试代码可以使用插件包根目录下仓库公开入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`，以及像 `login-qr-api.js` 这样的狭义文件。
  永远不要从核心或另一个扩展中导入插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具 / 类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置 provider 示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 作为 Claude 流辅助工具接缝，例如 `wrapAnthropicProviderStream`、beta 请求头辅助工具和 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 提供 provider 构建器、默认模型辅助工具和实时 provider 构建器。
  - OpenRouter 使用 `api.js` 提供其 provider 构建器以及新手引导 / 配置辅助工具，而 `register.runtime.js` 仍可以为仓库本地使用重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 通过 facade 加载的公开入口点会在存在活动运行时配置快照时优先使用它；如果 OpenClaw 尚未提供运行时快照，则回退到磁盘上的已解析配置文件。
- 通用共享原语仍然是首选的公开 SDK 契约。仍然存在一小组保留的、与内置渠道品牌相关的兼容性辅助工具接缝。应将这些视为内置维护 / 兼容性接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用狭义稳定原语。较新的 setup / pairing / reply /
  feedback / contract / inbound / threading / command / secret-input / webhook / infra /
  allowlist / status / message-tool 子路径，是新内置插件和外部插件开发的预期契约。
  目标解析 / 匹配应归属于 `openclaw/plugin-sdk/channel-targets`。
  消息动作闸门和 reaction message-id 辅助工具应归属于
  `openclaw/plugin-sdk/channel-actions`。
- 内置扩展特定的辅助工具 barrel 默认并不稳定。如果某个辅助工具只被某个内置扩展需要，应将它保留在该扩展本地的 `api.js` 或 `runtime-api.js` 接缝后面，而不是将其提升到
  `openclaw/plugin-sdk/<extension>`。
- 新的共享辅助工具接缝应当是通用的，而不是带渠道品牌的。共享目标解析应归属于 `openclaw/plugin-sdk/channel-targets`；渠道特定内部实现应保留在拥有该渠道的插件本地 `api.js` 或 `runtime-api.js`
  接缝之后。
- `image-generation`、
  `media-understanding` 和 `speech` 等能力特定子路径之所以存在，是因为内置 / 原生插件今天正在使用它们。它们的存在本身并不意味着每一个导出的辅助工具都是长期冻结的外部契约。

## 消息工具 schema

对于 reaction、已读和投票等非消息原语，插件应拥有渠道特定的 `describeMessageTool(...)` schema 贡献。
共享发送呈现应使用通用 `MessagePresentation` 契约，而不是 provider 原生的 button、component、block 或 card 字段。
契约、回退规则、provider 映射和插件作者检查清单请参见 [消息呈现](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明其可渲染内容：

- `presentation` 用于语义化呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于置顶投递请求

核心决定是原生渲染该呈现，还是将其降级为文本。不要从通用消息工具中公开 provider 原生 UI 逃生口。
为兼容现有第三方插件而保留的旧式原生 schema SDK 辅助工具仍然会导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站宿主的通用性，并使用消息适配器表面承载 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找之前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心，某个输入是否应跳过目录搜索，直接进入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，用于在规范化之后或目录未命中之后，由核心执行最终的 provider 自有解析。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后拥有 provider 特定的会话路由构造逻辑。

推荐拆分方式：

- 对于应在搜索联系人 / 群组之前做出的类别决策，使用 `inferTargetChatType`。
- 对于“将其视为显式 / 原生目标 id”的检查，使用 `looksLikeId`。
- 对于 provider 特定的规范化回退，使用 `resolveTarget`，而不是将其用于广泛的目录搜索。
- 将 provider 原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或 provider 特定参数中，而不是放在通用 SDK 字段里。

## 基于配置的目录

如果插件需要从配置推导目录项，应将该逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要基于配置的联系人 / 群组时，可以使用此方式，例如：

- 基于 allowlist 驱动的私信联系人
- 已配置的渠道 / 群组映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## provider 目录

provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 中相同的结构：

- `{ provider }` 表示一个 provider 条目
- `{ providers }` 表示多个 provider 条目

当插件拥有 provider 特定的 model id、base URL 默认值或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 providers 的合并时机：

- `simple`：纯 API key 或环境变量驱动的 providers
- `profile`：当存在认证配置文件时出现的 providers
- `paired`：会合成多个相关 provider 条目的 providers
- `late`：最后一轮，在其他隐式 providers 之后

后出现的 provider 会在键冲突时胜出，因此插件可以有意覆盖具有相同 provider id 的内置 provider 条目。

兼容性：

- `discovery` 仍可作为旧式别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先在 `resolveAccount(...)` 之外同时实现
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已经完全实体化，并且在缺少必要密钥时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor / 配置修复流程，不应仅为了描述配置就必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要仅为了报告只读可用性而返回原始 token 值。对于状态类命令，返回 `tokenStatus: "available"`（以及对应的来源字段）就足够了。
- 当凭证通过 SecretRef 配置但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样，只读命令就可以报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## Package packs

插件目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果该 pack 列出了多个扩展，则插件 id
会变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules`
可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保持在插件目录内。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时无开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅用于设置的模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面，或者某个渠道插件已启用但尚未完成配置时，它会加载 `setupEntry`
而不是完整插件入口。这样在你的主插件入口还会接线工具、钩子或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关监听前的启动阶段也走相同的 `setupEntry` 路径，即使该渠道已经配置完成。

只有在 `setupEntry` 能完全覆盖 Gateway 网关开始监听之前必须存在的启动表面时，才应使用此选项。实际而言，这意味着设置入口必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持插件的默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅用于设置的契约表面辅助工具，供核心在完整渠道运行时加载之前查询。当前的设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧式单账户渠道配置提升到
`channels.<id>.accounts.*` 时，会使用这部分表面。Matrix 是当前的内置示例：当已存在命名账户时，它只会将认证 / 引导键移动到某个已命名的提升账户中，并且它可以保留一个已配置的非规范默认账户键，而不是总是创建
`accounts.default`。

这些设置补丁适配器会让内置契约表面发现保持延迟加载。导入时保持轻量；提升表面只会在首次使用时加载，而不会在模块导入期间重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件特定前缀下。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析为 `operator.admin`，即使某个插件请求更窄的作用域也是如此。

示例：

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 渠道目录元数据

渠道插件可以通过 `openclaw.channel` 宣告设置 / 发现元数据，并通过 `openclaw.install` 宣告安装提示。这样可以让核心目录保持无数据状态。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "通过 Nextcloud Talk webhook bots 提供自托管聊天。",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

除了最小示例之外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录 / 状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：当前目录条目应优先于的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制项
- `markdownCapable`：将该渠道标记为支持 Markdown，以供出站格式决策使用
- `exposure.configured`：设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部 / 私有，以供文档导航表面使用
- `showConfigured` / `showInSetup`：旧式别名，出于兼容性仍可接受；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将 JSON 文件放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（用逗号 / 分号 / `PATH` 分隔）。每个文件应包含
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧式别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，包括摄取、组装和压缩。可在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后通过
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不是仅仅添加 memory 搜索或钩子时，请使用这种方式。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果你的引擎**不**拥有压缩算法，请保持实现 `compact()`，并显式委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 添加新能力

当某个插件需要当前 API 无法适配的行为时，不要通过私有深入访问绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义核心契约
   决定核心应拥有哪些共享行为：策略、回退、配置合并、生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册 / 运行时表面
   用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线核心 + 渠道 / 功能使用方
   渠道和功能插件应通过核心消费这项新能力，而不是直接导入某个厂商实现。
4. 注册厂商实现
   然后由厂商插件将其后端注册到这项能力上。
5. 添加契约覆盖
   增加测试，以便让归属和注册形态在长期演进中保持明确。

这就是 OpenClaw 如何在保持明确设计立场的同时，不被某个 provider 的世界观硬编码。具体的文件检查清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加新能力时，实现通常应一起涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，`src/plugins/runtime/*` 中的插件运行时公开表面
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中的运维 / 插件文档

如果这些表面中缺了某一项，通常说明该能力还没有完全接入。

### 能力模板

最小模式：

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这样规则就很简单：

- 核心拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试让归属保持明确
