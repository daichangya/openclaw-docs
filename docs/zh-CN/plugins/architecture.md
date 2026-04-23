---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属关系、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-23T06:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69075cecab525aacd19e350605c135334bdcfe913c2f024a48ff68e5b1e80f8c
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参见：
  - [Install and use plugins](/zh-CN/tools/plugin) —— 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) —— 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 构建一个消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) —— 构建一个模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) —— 导入映射和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个
原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

| 能力 | 注册方法 | 示例插件 |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文本推理 | `api.registerProvider(...)` | `openai`, `anthropic` |
| CLI 推理后端 | `api.registerCliBackend(...)` | `openai`, `anthropic` |
| 语音 | `api.registerSpeechProvider(...)` | `elevenlabs`, `microsoft` |
| 实时转录 | `api.registerRealtimeTranscriptionProvider(...)` | `openai` |
| 实时语音 | `api.registerRealtimeVoiceProvider(...)` | `openai` |
| 媒体理解 | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google` |
| 图像生成 | `api.registerImageGenerationProvider(...)` | `openai`, `google`, `fal`, `minimax` |
| 音乐生成 | `api.registerMusicGenerationProvider(...)` | `google`, `minimax` |
| 视频生成 | `api.registerVideoGenerationProvider(...)` | `qwen` |
| 网页抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| 网页搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息传递 | `api.registerChannel(...)` | `msteams`, `matrix` |

一个注册了零个能力、但提供钩子、工具或
服务的插件，是**旧式仅钩子**插件。该模式仍然受到完全支持。

### 外部兼容性立场

能力模型已经在核心中落地，并且今天已被内置/原生插件
使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”
更严格的标准。

当前指导原则：

- **现有外部插件：** 保持基于钩子的集成正常工作；将其视为
  兼容性的基线
- **新的内置/原生插件：** 优先使用显式能力注册，而不是
  依赖供应商专用的穿透式访问，或新的仅钩子设计
- **采用能力注册的外部插件：** 允许这样做，但除非文档明确将某个契约标记为稳定，
  否则应将能力专用的辅助表面视为仍在演进中

实用规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，旧式钩子仍然是外部插件最安全、最不易破坏的路径
- 导出的辅助子路径并不完全等价；优先选择有文档说明的狭窄
  契约，而不是附带导出的辅助工具

### 插件形态

OpenClaw 会根据每个已加载插件的实际
注册行为将其分类为一种形态（而不仅仅是静态元数据）：

- **plain-capability** —— 恰好注册一种能力类型（例如仅提供商插件
  `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如
  `openai` 同时拥有文本推理、语音、媒体理解和图像
  生成）
- **hook-only** —— 仅注册钩子（类型化或自定义），不注册能力、
  工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册
  能力

使用 `openclaw plugins inspect <id>` 查看插件的形态和能力
明细。详情请参见 [CLI reference](/zh-CN/cli/plugins#inspect)。

### 旧式钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容路径受到支持。
现实中仍有旧插件依赖它。

方向：

- 保持其正常工作
- 将其记录为旧式能力
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降，且夹具覆盖证明迁移安全后，才移除它

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到
以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，插件可解析 |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用 `before_agent_start`，该项已弃用 |
| **hard error** | 配置无效，或插件加载失败 |

如今，`hook-only` 和 `before_agent_start` 都不会让你的插件失效——
`hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些
信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **Manifest + 设备发现**
   OpenClaw 会从已配置路径、工作区根目录、
   全局插件根目录以及内置插件中查找候选插件。设备发现会优先读取原生
   `openclaw.plugin.json` manifest，以及受支持的 bundle manifest。
2. **启用 + 校验**
   核心决定某个已发现插件是已启用、已禁用、被阻止，还是
   被选中用于某个独占槽位，例如 memory。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将
   能力注册到中央注册表中。兼容的 bundle 会被规范化为
   注册表记录，而无需导入运行时代码。
4. **表面消费**
   OpenClaw 的其余部分读取注册表，以暴露工具、渠道、提供商
   设置、钩子、HTTP 路由、CLI 命令和服务。

对于插件 CLI 而言，根命令发现专门分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，并在首次调用时注册

这样可以将插件自有的 CLI 代码保留在插件内部，同时仍让 OpenClaw
在解析前保留根命令名称。

重要的设计边界是：

- 设备发现 + 配置校验应能基于**manifest/schema 元数据**
  完成，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能够在完整运行时尚未激活之前，
校验配置、解释缺失/禁用的插件，并构建 UI/schema 提示。

### 渠道插件和共享 message 工具

对于普通聊天操作，渠道插件不需要注册单独的发送/编辑/react 工具。
OpenClaw 在核心中保留一个共享的 `message` 工具，而
渠道插件负责其背后的渠道专属发现和执行。

当前边界如下：

- 核心负责共享 `message` 工具宿主、提示词接线、会话/线程
  记录和执行分发
- 渠道插件负责作用域内操作发现、能力发现，以及任何
  渠道专属 schema 片段
- 渠道插件负责提供商专属的会话对话语法，例如
  对话 id 如何编码线程 id，或如何从父对话继承
- 渠道插件通过其 action adapter 执行最终操作

对于渠道插件，SDK 表面是
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现
调用让插件可以将其可见操作、能力和 schema 贡献一起返回，
从而避免这些部分彼此漂移。

当某个渠道专属 message-tool 参数携带媒体源，例如
本地路径或远程媒体 URL 时，插件还应从
`describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这份显式
列表来应用沙箱路径规范化和出站媒体访问提示，而无需硬编码插件自有的参数名称。
在这里优先使用按 action 分组的映射，而不是整个渠道范围的单一平面列表，
这样仅用于 profile 的媒体参数就不会在诸如
`send` 之类无关操作上被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感的插件很重要。一个渠道可以根据活跃账户、
当前房间/线程/消息或受信任的请求者身份来隐藏或暴露
message 操作，而无需在核心 `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式运行器路由变更仍然属于插件工作：运行器
负责将当前聊天/会话身份转发到插件发现边界，以便共享的 `message`
工具为当前轮次暴露正确的插件自有表面。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在其
自有的扩展模块中。核心不再在 `src/agents/tools` 下拥有 Discord、
Slack、Telegram 或 WhatsApp 的消息操作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置
插件应直接从其扩展自有模块导入本地运行时代码。

同样的边界也适用于一般的提供商命名 SDK 接缝：核心
不应导入 Slack、Discord、Signal、
WhatsApp 或类似扩展的渠道专用便捷 barrel。如果核心需要某个行为，
要么消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中狭窄的通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用
  投票模型渠道的共享基线
- `actions.handleAction("poll")` 是更推荐的路径，适用于渠道专属
  投票语义或额外投票参数

现在，核心会在插件投票分发拒绝该操作之后，才延迟进行共享投票解析，
因此插件自有的投票处理器可以接受渠道专属的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [Load pipeline](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或
**功能**的归属边界，而不是一堆无关集成的杂货袋。

这意味着：

- 一个公司插件通常应拥有该公司所有面向 OpenClaw 的
  表面
- 一个功能插件通常应拥有它引入的完整功能表面
- 渠道应消费共享核心能力，而不是临时重新实现
  提供商行为

示例：

- 内置的 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI
  语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置的 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置的 `microsoft` 插件拥有 Microsoft 语音行为
- 内置的 `google` 插件拥有 Google 模型提供商行为，以及 Google
  媒体理解 + 图像生成 + 网页搜索行为
- 内置的 `firecrawl` 插件拥有 Firecrawl 网页抓取行为
- 内置的 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的
  媒体理解后端
- 内置的 `qwen` 插件拥有 Qwen 文本提供商行为，以及
  媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、
  CLI、路由和 Twilio 媒体流桥接，但它消费共享语音
  以及实时转录和实时语音能力，而不是直接导入供应商插件

预期的最终状态是：

- OpenAI 即使横跨文本模型、语音、图像以及未来的视频，也应存在于同一个插件中
- 其他供应商也可以对其自己的表面范围采用同样方式
- 渠道并不关心是哪个供应商插件拥有该提供商；它们消费的是由核心暴露的共享能力契约

这就是关键区别：

- **plugin** = 归属边界
- **capability** = 多个插件都可以实现或消费的核心契约

因此，如果 OpenClaw 添加了一个新领域，例如视频，第一个问题
不应是“哪个提供商应该硬编码视频处理？”第一个问题应是“核心视频能力契约
是什么？”一旦这个契约存在，供应商插件
就可以针对它进行注册，而渠道/功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 以类型化的方式通过插件 API/运行时暴露它
3. 让渠道/功能针对该能力进行接线
4. 让供应商插件注册实现

这样可以在保持归属明确的同时，避免核心行为依赖于某个
单一供应商或某条一次性的插件专属代码路径。

### 能力分层

在决定代码应放在哪里时，请使用这个思维模型：

- **核心能力层**：共享编排、策略、回退、配置
  合并规则、投递语义和类型化契约
- **供应商插件层**：供应商专属 API、认证、模型目录、语音
  合成、图像生成、未来的视频后端、用量端点
- **渠道/功能插件层**：Slack/Discord/voice-call 等集成，
  它们消费核心能力并将其呈现在某个表面上

例如，TTS 遵循这种结构：

- 核心负责回复时 TTS 策略、回退顺序、偏好设置和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 负责合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

对于未来的能力，也应优先采用同样的模式。

### 多能力公司插件示例

一个公司插件从外部看应当是内聚的。如果 OpenClaw 具有针对模型、语音、实时转录、实时语音、媒体
理解、图像生成、视频生成、网页抓取和网页搜索的共享
契约，那么一个供应商可以在一个地方拥有其所有表面：

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

重要的不是辅助函数的确切名称。重要的是这种结构：

- 一个插件拥有供应商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费的是 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言插件确实注册了它
  声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一种共享
能力。相同的归属模型也适用于此：

1. 核心定义媒体理解契约
2. 供应商插件按需注册 `describeImage`、`transcribeAudio` 和
   `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是
   直接接线到供应商代码

这样可避免将某个提供商对视频的假设固化到核心中。插件拥有
供应商表面；核心拥有能力契约和回退行为。

视频生成已经采用了同样的顺序：核心拥有类型化的
能力契约和运行时辅助工具，而供应商插件则注册
`api.registerVideoGenerationProvider(...)` 实现来对接它。

需要一份具体的发布检查清单？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面被有意设计为类型化并集中在
`OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及
插件可以依赖的运行时辅助工具。

这很重要，因为：

- 插件作者可以获得一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册相同的
  provider id
- 启动过程可以为格式错误的注册暴露可执行的诊断信息
- 契约测试可以强制执行内置插件归属，并防止悄然漂移

存在两层强制执行：

1. **运行时注册强制执行**
   插件注册表会在插件加载时校验注册。例如：
   重复的 provider id、重复的语音提供商 id，以及格式错误的
   注册，都会产生插件诊断，而不是未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被记录到契约注册表中，
   因此 OpenClaw 可以显式断言归属。今天这被用于模型
   提供商、语音提供商、网页搜索提供商以及内置注册归属。

实际效果是，OpenClaw 能够预先知道，哪个插件拥有哪个
表面。这让核心和渠道可以无缝组合，因为归属是被声明、类型化且可测试的，而不是隐式的。

### 什么内容应属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力专属的
- 由核心拥有
- 可被多个插件复用
- 可被渠道/功能消费，而无需了解供应商知识

不好的插件契约包括：

- 隐藏在核心中的供应商专属策略
- 绕过注册表的一次性插件逃逸口
- 渠道代码直接伸手访问某个供应商实现
- 不属于 `OpenClawPluginApi` 或
  `api.runtime` 的临时运行时对象

如有疑问，请提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们并未
沙箱隔离。一个已加载的原生插件与核心代码具有相同的进程级信任边界。

其含义是：

- 一个原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码

兼容的 bundle 默认更安全，因为 OpenClaw 当前将它们视为
元数据/内容包。在当前版本中，这主要意味着内置
Skills。

对于非内置插件，请使用允许列表和显式安装/加载路径。将
工作区插件视为开发期代码，而不是生产环境默认值。

对于内置工作区 package 名称，请让插件 id 锚定在 npm
名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄插件角色时，
使用已批准的类型化后缀，例如
`-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源证明。
- 与内置插件具有相同 id 的工作区插件，在该工作区插件被启用/加入允许列表时，
  会有意遮蔽内置副本。
- 这属于正常且有用的行为，可用于本地开发、补丁测试和热修复。

## 导出边界

OpenClaw 导出的是能力，而不是实现便捷工具。

保持能力注册为公开。裁剪非契约辅助导出：

- 内置插件专属的辅助子路径
- 不打算作为公开 API 的运行时接线子路径
- 供应商专属便捷辅助工具
- 属于实现细节的设置/新手引导辅助工具

出于兼容性和内置插件维护需要，一些内置插件辅助子路径
仍保留在生成的 SDK 导出映射中。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。请将这些视为
保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 与 package 元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)` —— 旧式别名）钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧式别名 —— 加载器会解析二者中存在的那个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门控发生在**运行时执行之前**。当候选项出现以下情况时会被阻止：
入口逃逸出插件根目录、路径可被所有人写入，或者对于非内置插件而言，
路径归属看起来可疑。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现已声明的渠道/Skills/配置 schema 或 bundle 能力
- 校验 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下保留轻量级激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它负责注册
实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍属于控制平面。
它们是用于激活规划和设置发现的纯元数据描述符；
不会取代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活消费者现在会使用 manifest 中的命令、渠道和提供商提示，
在更广泛的注册表实体化之前先缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求
  channel id 的插件
- 显式提供商设置/运行时解析会缩小到拥有所请求
  provider id 的插件

设置发现现在会优先使用描述符自有的 id，例如 `setup.providers` 和
`setup.cliBackends`，以便在回退到
`setup-api` 之前先缩小候选插件范围；`setup-api` 仅用于那些仍然需要设置阶段运行时钩子的插件。如果多个已发现插件声称拥有同一个已规范化的设置提供商或 CLI 后端 id，设置查找会拒绝这个存在歧义的归属者，而不是依赖发现顺序。

### 加载器会缓存什么

OpenClaw 会保留以下短生命周期的进程内缓存：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发式启动开销和重复命令的开销。可以安全地将它们视为短期性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存时间窗口。

## 注册表模型

已加载插件不会直接修改随意的核心全局状态。它们会注册到一个
中央插件注册表中。

该注册表会跟踪：

- 插件记录（身份、来源、出处、状态、诊断）
- 工具
- 旧式钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

然后，核心功能从该注册表中读取，而不是直接与插件模块交互。
这使得加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。这意味着大多数核心表面只需要一个集成点：
“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在批准结果确定时作出响应。

使用 `api.onConversationBindingResolved(...)` 在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 现在已为此插件 + 会话建立绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求被拒绝；清除任何本地待定状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id，以及
  会话元数据

此回调仅用于通知。它不会改变谁被允许绑定某个
会话，并且它会在核心的批准处理完成后运行。

## 提供商运行时钩子

提供商插件现在有两层：

- manifest 元数据：`providerAuthEnvVars` 用于在运行时加载前
  进行轻量级提供商环境变量认证查找，`providerAuthAliases` 用于共享
  认证的提供商变体，`channelEnvVars` 用于在运行时
  加载前进行轻量级渠道环境变量/设置查找，以及 `providerAuthChoices` 用于在运行时加载前
  提供轻量级新手引导/认证选择标签和 CLI flag 元数据
- 配置阶段钩子：`catalog` / 旧式 `discovery`，以及 `applyConfigDefaults`
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

OpenClaw 仍然拥有通用智能体循环、故障切换、转录处理和
工具策略。这些钩子是提供商专属行为的扩展表面，
无需为此实现整个自定义推理传输。

当某个提供商具有基于环境变量的凭证，且通用认证/状态/模型选择器路径应当在不加载插件运行时的情况下看到这些凭证时，请使用 manifest `providerAuthEnvVars`。当一个 provider id 应复用另一个 provider id 的环境变量、认证配置文件、基于配置的认证和 API key 新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导/认证选择 CLI 表面应在不加载提供商运行时的情况下知道该提供商的 choice id、分组标签和简单的单 flag 认证接线时，请使用 manifest `providerAuthChoices`。将提供商运行时的 `envVars` 保留给面向运维人员的提示，例如新手引导标签或 OAuth
client-id/client-secret 设置变量。

当某个渠道具有基于环境变量驱动的认证或设置，且通用 shell 环境变量回退、配置/状态检查或设置提示应当在不加载渠道运行时的情况下看到这些内容时，请使用 manifest `channelEnvVars`。

### 钩子顺序与用法

对于模型/提供商插件，OpenClaw 大致按如下顺序调用这些钩子。
“何时使用”这一列可作为快速决策指南。

| # | 钩子 | 它的作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `catalog` | 在生成 `models.json` 期间将提供商配置发布到 `models.providers` 中 | 提供商拥有目录或 base URL 默认值 |
| 2 | `applyConfigDefaults` | 在配置实体化期间应用提供商自有的全局配置默认值 | 默认值依赖于认证模式、环境变量或提供商模型家族语义 |
| -- | _(内置模型查找)_ | OpenClaw 会先尝试正常的注册表/目录路径 | _(不是插件钩子)_ |
| 3 | `normalizeModelId` | 在查找前规范化旧式或预览版 model-id 别名 | 提供商在规范模型解析前拥有别名清理逻辑 |
| 4 | `normalizeTransport` | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商拥有同一传输家族内自定义 provider id 的传输清理逻辑 |
| 5 | `normalizeConfig` | 在运行时/提供商解析前规范化 `models.providers.<id>` | 提供商需要将配置清理逻辑放在插件中；内置的 Google 家族辅助工具也会为受支持的 Google 配置条目提供兜底 |
| 6 | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写 | 提供商需要基于端点对原生流式用量元数据进行修正 |
| 7 | `resolveConfigApiKey` | 在运行时认证加载前，为配置提供商解析环境变量标记认证 | 提供商拥有自己的环境变量标记 API key 解析逻辑；`amazon-bedrock` 在这里也有一个内置的 AWS 环境变量标记解析器 |
| 8 | `resolveSyntheticAuth` | 在不持久化明文的情况下暴露本地/自托管或基于配置的认证 | 提供商可使用合成/本地凭证标记运行 |
| 9 | `resolveExternalAuthProfiles` | 覆盖提供商自有的外部认证配置文件；`persistence` 默认为 `runtime-only`，适用于 CLI/应用自有凭证 | 提供商在不持久化复制的 refresh token 的情况下复用外部认证凭证；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10 | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符降低到环境变量/基于配置的认证之后 | 提供商会存储合成占位配置文件，而这些占位符不应具有更高优先级 |
| 11 | `resolveDynamicModel` | 对本地注册表中尚不存在的提供商自有模型 id 执行同步回退解析 | 提供商接受任意上游模型 id |
| 12 | `prepareDynamicModel` | 执行异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 前需要网络元数据 |
| 13 | `normalizeResolvedModel` | 在嵌入式运行器使用已解析模型前执行最终重写 | 提供商需要传输重写，但仍使用核心传输 |
| 14 | `contributeResolvedModelCompat` | 为位于其他兼容传输之后的供应商模型贡献兼容性标志 | 提供商能在代理传输上识别自己的模型，而无需接管该提供商 |
| 15 | `capabilities` | 由提供商拥有、被共享核心逻辑使用的转录/工具元数据 | 提供商需要处理转录或提供商家族特性 |
| 16 | `normalizeToolSchemas` | 在嵌入式运行器看到工具 schema 之前对其进行规范化 | 提供商需要传输家族级别的 schema 清理 |
| 17 | `inspectToolSchemas` | 在规范化之后暴露提供商自有的 schema 诊断 | 提供商希望提供关键字警告，而不必让核心理解提供商专属规则 |
| 18 | `resolveReasoningOutputMode` | 选择原生或带标签的推理输出契约 | 提供商需要使用带标签的推理/最终输出，而不是原生字段 |
| 19 | `prepareExtraParams` | 在通用流式选项包装器之前规范化请求参数 | 提供商需要默认请求参数或按提供商执行参数清理 |
| 20 | `createStreamFn` | 使用自定义传输完全替换正常流路径 | 提供商需要自定义线协议，而不只是包装器 |
| 21 | `wrapStreamFn` | 在应用通用包装器之后对流进行包装 | 提供商需要请求头/请求体/模型兼容性包装器，而不是自定义传输 |
| 22 | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | 提供商希望通用传输发送提供商原生的轮次标识 |
| 23 | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 请求头或会话冷却策略 | 提供商希望通用 WS 传输调整会话请求头或回退策略 |
| 24 | `formatApiKey` | 认证配置文件格式化器：已存储的配置文件会变成运行时 `apiKey` 字符串 | 提供商存储了额外认证元数据，并需要自定义运行时 token 形态 |
| 25 | `refreshOAuth` | 针对自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | 提供商不适配共享的 `pi-ai` 刷新器 |
| 26 | `buildAuthDoctorHint` | 当 OAuth 刷新失败时附加的修复提示 | 提供商在刷新失败后需要提供商自有的认证修复指导 |
| 27 | `matchesContextOverflowError` | 提供商自有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法捕获的原始溢出错误 |
| 28 | `classifyFailoverReason` | 提供商自有的故障切换原因分类 | 提供商可以将原始 API/传输错误映射为限流、过载等 |
| 29 | `isCacheTtlEligible` | 面向代理/回程提供商的提示词缓存策略 | 提供商需要代理专属的缓存 TTL 门控 |
| 30 | `buildMissingAuthMessage` | 替代通用缺失认证恢复消息 | 提供商需要提供商专属的缺失认证恢复提示 |
| 31 | `suppressBuiltInModel` | 抑制过时的上游模型，并可选提供面向用户的错误提示 | 提供商需要隐藏过时的上游条目，或用供应商提示替换它们 |
| 32 | `augmentModelCatalog` | 在发现之后追加合成/最终目录条目 | 提供商需要在 `models list` 和选择器中提供合成的前向兼容条目 |
| 33 | `resolveThinkingProfile` | 设置特定于模型的 `/think` 级别、显示标签和默认值 | 提供商为选定模型暴露自定义思考等级体系或二元标签 |
| 34 | `isBinaryThinking` | 开/关推理切换兼容性钩子 | 提供商只暴露二元的思考开/关 |
| 35 | `supportsXHighThinking` | `xhigh` 推理支持兼容性钩子 | 提供商只希望在部分模型上支持 `xhigh` |
| 36 | `resolveDefaultThinkingLevel` | 默认 `/think` 级别兼容性钩子 | 提供商拥有某个模型家族的默认 `/think` 策略 |
| 37 | `isModernModelRef` | 用于实时配置文件过滤和冒烟选择的现代模型匹配器 | 提供商拥有实时/冒烟首选模型匹配逻辑 |
| 38 | `prepareRuntimeAuth` | 在推理前将已配置的凭证交换为实际运行时 token/key | 提供商需要执行 token 交换或使用短生命周期请求凭证 |
| 39 | `resolveUsageAuth` | 为 `/usage` 及相关状态表面解析用量/计费凭证 | 提供商需要自定义用量/配额 token 解析，或使用不同的用量凭证 |
| 40 | `fetchUsageSnapshot` | 在认证解析后获取并规范化提供商专属的用量/配额快照 | 提供商需要提供商专属的用量端点或负载解析器 |
| 41 | `createEmbeddingProvider` | 为 memory/search 构建由提供商拥有的 embedding adapter | Memory 的 embedding 行为应归属于提供商插件 |
| 42 | `buildReplayPolicy` | 返回一个控制该提供商转录处理方式的重放策略 | 提供商需要自定义转录策略（例如剥离 thinking 块） |
| 43 | `sanitizeReplayHistory` | 在通用转录清理后重写重放历史 | 提供商需要在共享压缩辅助工具之外执行提供商专属的重放重写 |
| 44 | `validateReplayTurns` | 在嵌入式运行器之前对重放轮次做最终校验或重塑 | 提供商传输在通用净化后仍需要更严格的轮次校验 |
| 45 | `onModelSelected` | 在模型被选中后运行提供商自有的后续副作用 | 当某个模型变为活跃时，提供商需要遥测或提供商自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查
匹配到的提供商插件，然后继续传递给其他具备钩子能力的提供商插件，
直到其中某个插件实际修改了模型 id 或传输/配置为止。这样可以让
别名/兼容性提供商 shim 正常工作，而不要求调用方知道究竟是哪个
内置插件拥有该重写逻辑。如果没有任何提供商钩子重写某个受支持的
Google 家族配置条目，内置的 Google 配置规范化器仍会执行该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，
那属于另一类扩展。这些钩子适用于仍然运行在 OpenClaw
正常推理循环上的提供商行为。

### 提供商示例

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
  和 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、
  提供商家族提示、认证修复指导、用量端点集成、
  提示词缓存可用性、具备认证感知能力的配置默认值、Claude
  默认/自适应思考策略，以及面向
  beta headers、`/fast` / `serviceTier` 和 `context1m` 的 Anthropic 专属流整形能力。
- Anthropic 的 Claude 专属流辅助工具目前保留在内置插件自身公开的
  `api.ts` / `contract-api.ts` 接缝中。该 package 表面
  导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的
  Anthropic wrapper builder，而不是围绕某一个
  提供商的 beta-header 规则扩展通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`resolveThinkingProfile` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接的 OpenAI
  `openai-completions` -> `openai-responses` 规范化、面向 Codex 的认证
  提示、Spark 抑制、合成 OpenAI 列表条目，以及 GPT-5 的思考 /
  实时模型策略；`openai-responses-defaults` 流家族拥有共享的原生 OpenAI Responses 包装器，用于处理归因请求头、
  `/fast`/`serviceTier`、文本冗长度、原生 Codex 网页搜索、
  推理兼容性负载整形，以及 Responses 上下文管理。
- OpenRouter 使用 `catalog`，以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该提供商是透传型的，并且可能在
  OpenClaw 静态目录更新之前暴露新的模型 id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以便将
  提供商专属请求头、路由元数据、推理补丁以及
  提示词缓存策略放在核心之外。其重放策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流家族
  拥有代理推理注入以及对不受支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，
  因为它需要提供商自有的设备登录、模型回退行为、Claude 转录
  特性、GitHub token -> Copilot token 交换，以及提供商自有的用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  虽然仍运行在核心 OpenAI 传输之上，但拥有自己的传输/base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  合成 Codex 目录条目，以及 ChatGPT 用量端点集成；它
  与直接 OpenAI 共享相同的 `openai-responses-defaults` 流家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` 重放家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini 重放校验、引导式重放净化、
  带标签的推理输出模式，以及现代模型匹配，而
  `google-thinking` 流家族拥有 Gemini thinking 负载规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot`，用于 token 格式化、token 解析以及配额端点
  接线。
- Anthropic Vertex 通过
  `anthropic-by-model` 重放家族使用 `buildReplayPolicy`，这样 Claude 专属的重放清理
  只会限定在 Claude id 上，而不是作用于每个 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveThinkingProfile`，因为它拥有
  针对 Anthropic-on-Bedrock 流量的 Bedrock 专属限流/未就绪/上下文溢出错误分类；
  其重放策略仍与相同的
  仅 Claude 的 `anthropic-by-model` 防护共享。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过 `buildReplayPolicy`
  使用 `passthrough-gemini` 重放家族，因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，并且需要 Gemini
  thought-signature 净化，而不需要原生 Gemini 重放校验或
  引导式重写。
- MiniMax 通过
  `hybrid-anthropic-openai` 重放家族使用 `buildReplayPolicy`，因为一个提供商同时拥有
  Anthropic-message 和 OpenAI 兼容语义；它在 Anthropic 一侧保留仅 Claude 的
  thinking 块丢弃逻辑，同时将推理
  输出模式覆盖回原生，而 `minimax-fast-mode` 流家族则拥有
  共享流路径上的 fast-mode 模型重写。
- Moonshot 使用 `catalog`、`resolveThinkingProfile` 和 `wrapStreamFn`，因为它仍使用共享的
  OpenAI 传输，但需要提供商自有的 thinking 负载规范化；而
  `moonshot-thinking` 流家族则将配置加上 `/think` 状态映射到其
  原生的二元 thinking 负载。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要提供商自有的请求头、
  推理负载规范化、Gemini 转录提示以及 Anthropic
  缓存 TTL 门控；`kilocode-thinking` 流家族会在共享代理流路径上保留 Kilo thinking
  注入，同时跳过 `kilo/auto` 和其他
  不支持显式推理负载的代理模型 id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`resolveThinkingProfile`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking UX、现代模型匹配，以及
  用量认证和配额获取；`tool-stream-default-on` 流家族则将默认开启的 `tool_stream` 包装器从各提供商手写胶水代码中抽离出来。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode
  别名重写、默认 `tool_stream`、严格工具 / 推理负载
  清理、面向插件自有工具的回退认证复用、前向兼容的 Grok
  模型解析，以及提供商自有的兼容性补丁，例如 xAI 工具 schema
  配置、受支持性不足的 schema 关键字、原生 `web_search` 和 HTML 实体
  工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，
  以便将转录/工具特性留在核心之外。
- 仅目录型的内置提供商，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`
  只使用 `catalog`。
- Qwen 使用 `catalog` 作为其文本提供商能力，同时为其多模态表面注册共享的媒体理解和
  视频生成能力。
- MiniMax 和 Xiaomi 使用 `catalog` 加上用量钩子，因为它们的 `/usage`
  行为归插件所有，尽管推理仍通过共享传输运行。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问经过挑选的核心辅助工具。对于 TTS：

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

- `textToSpeech` 返回适用于文件/语音便笺表面的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为各自提供商完成重采样/编码。
- `listVoices` 对每个提供商而言是可选的。可将其用于供应商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和个性标签，以供具备提供商感知能力的选择器使用。
- 当前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

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
- 使用语音提供商来承载供应商自有的合成行为。
- 旧式 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 更推荐的归属模型是面向公司：随着 OpenClaw 增加这些
  能力契约，一个供应商插件可以同时拥有
  文本、语音、图像和未来的媒体提供商能力。

对于图像/音频/视频理解，插件会注册一个类型化的
媒体理解提供商，而不是通用的键值包：

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
- 将供应商行为保留在提供商插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选
  结果字段、新的可选能力。
- 视频生成已经遵循同样的模式：
  - 核心拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

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

对于音频转录，插件既可以使用媒体理解运行时，
也可以使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 当无法可靠推断 MIME 时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解
  首选的共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当没有生成转录输出时（例如输入被跳过/不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台子智能体运行：

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

- `provider` 和 `model` 是每次运行的可选覆盖项，而不是持久化的会话更改。
- OpenClaw 只会对受信任调用方应用这些覆盖字段。
- 对于插件自有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 明确允许任意目标。
- 不受信任的插件子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于网页搜索，插件可以消费共享运行时辅助工具，而不是
直接深入智能体工具接线：

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
`api.registerWebSearchProvider(...)` 注册网页搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 使用网页搜索提供商来承载供应商专属搜索传输。
- `api.runtime.webSearch.*` 是首选的共享表面，适用于需要搜索行为但不依赖智能体工具包装器的功能/渠道插件。

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

- `generate(...)`：使用已配置的图像生成提供商链生成图像。
- `listProviders(...)`：列出可用的图像生成提供商及其能力。

## Gateway 网关 HTTP 路由

插件可以通过 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

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
- `auth`：必填。使用 `"gateway"` 以要求普通 Gateway 网关认证，或使用 `"plugin"` 以启用插件管理的认证/webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置了 `replaceExisting: true`，否则精确的 `path + match` 冲突会被拒绝，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别下保留 `exact`/`prefix` 回退链。
- `auth: "plugin"` 路由**不会**自动接收运维人员运行时作用域。它们用于插件管理的 webhook/签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由运行在 Gateway 网关请求运行时作用域内，但该作用域被有意保持为保守模式：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 带有受信任身份信息的 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在显式存在该请求头时才会尊重 `x-openclaw-scopes`
  - 如果这些带身份信息的插件路由请求缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实际规则：不要假设一个使用 gateway 认证的插件路由天然就是管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用带身份信息的认证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写插件时，请使用 SDK 子路径，而不是使用单体式的 `openclaw/plugin-sdk` 导入：

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
  `openclaw/plugin-sdk/secret-input` 以及
  `openclaw/plugin-sdk/webhook-ingress`，用于共享设置/认证/回复/webhook
  接线。`channel-inbound` 是防抖、提及匹配、
  入站提及策略辅助工具、信封格式化以及入站信封
  上下文辅助工具的共享归属位置。
  `channel-setup` 是狭窄的可选安装设置接缝。
  `setup-runtime` 是 `setupEntry` /
  延迟启动所使用的运行时安全设置表面，其中包括导入安全的设置补丁适配器。
  `setup-adapter-runtime` 是具备环境感知能力的账户设置适配器接缝。
  `setup-tools` 是小型 CLI/归档/文档辅助工具接缝（`formatCliCommand`、
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
  `openclaw/plugin-sdk/runtime-store` 以及
  `openclaw/plugin-sdk/directory-runtime`，用于共享运行时/配置辅助工具。
  `telegram-command-config` 是 Telegram 自定义
  命令规范化/校验的狭窄公开接缝，即使内置的
  Telegram 契约表面暂时不可用，它仍会保持可用。
  `text-runtime` 是共享的文本/Markdown/日志接缝，其中包括
  面向助手可见文本的剥离、Markdown 渲染/分块辅助工具、脱敏
  辅助工具、directive-tag 辅助工具以及安全文本工具。
- 审批专用的渠道接缝应优先在插件上使用单一的 `approvalCapability`
  契约。然后核心会通过这一项能力读取审批认证、投递、渲染、
  原生路由和惰性原生处理器行为，而不是将审批行为混入无关的插件字段中。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，当前仅作为
  旧插件的兼容性 shim 保留。新代码应改用更狭窄的
  通用原语导入，而仓库代码不应新增对该 shim 的导入。
- 内置扩展内部实现仍然是私有的。外部插件应只使用
  `openclaw/plugin-sdk/*` 子路径。OpenClaw 核心/测试代码可以使用
  插件 package 根目录下的仓库公开入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js` 以及狭窄范围的文件，例如
  `login-qr-api.js`。绝不要从核心或另一个扩展中导入某个插件 package 的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具/类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置提供商示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 提供 Claude 流辅助工具，例如
    `wrapAnthropicProviderStream`、beta-header 辅助工具以及 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 提供 provider builder、默认模型辅助工具以及
    realtime provider builder。
  - OpenRouter 使用 `api.js` 提供其 provider builder 以及新手引导/配置
    辅助工具，而 `register.runtime.js` 仍可为仓库本地用途重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 由 facade 加载的公开入口点在存在活动运行时配置快照时会优先使用该快照，
  否则当 OpenClaw 尚未提供运行时快照时，会回退到磁盘上已解析的配置文件。
- 通用共享原语仍然是首选的公开 SDK 契约。仍然存在一小组保留的、兼容性用途的内置渠道品牌化辅助工具接缝。请将这些视为内置维护/兼容性接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根级 `openclaw/plugin-sdk` barrel。
- 优先使用狭窄且稳定的原语。较新的 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 子路径，才是新的
  内置和外部插件工作的预期契约。
  目标解析/匹配应放在 `openclaw/plugin-sdk/channel-targets` 上。
  消息操作门控和 reaction message-id 辅助工具应放在
  `openclaw/plugin-sdk/channel-actions` 上。
- 内置扩展专用的辅助 barrel 默认并不稳定。如果某个
  辅助工具只被内置扩展需要，应将其保留在扩展本地的
  `api.js` 或 `runtime-api.js` 接缝之后，而不是提升到
  `openclaw/plugin-sdk/<extension>` 中。
- 新的共享辅助工具接缝应当是通用的，而不是带渠道品牌的。共享目标
  解析应放在 `openclaw/plugin-sdk/channel-targets`；渠道专属
  内部实现则保留在归属插件本地的 `api.js` 或 `runtime-api.js`
  接缝之后。
- `image-generation`、
  `media-understanding` 和 `speech` 等能力专属子路径之所以存在，是因为今天
  内置/原生插件正在使用它们。它们的存在本身并不意味着每个导出的辅助工具
  都是长期冻结的外部契约。

## 消息工具 schema

对于 reaction、已读和投票等非消息原语，
插件应拥有渠道专属的 `describeMessageTool(...)` schema
贡献。共享发送展示应使用通用 `MessagePresentation` 契约，
而不是提供商原生的按钮、组件、区块或卡片字段。
有关该契约、回退规则、提供商映射以及插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明自己可以渲染什么：

- `presentation`：语义化展示区块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`：置顶投递请求

核心决定是原生渲染该展示，还是将其降级为文本。
不要从通用消息工具中暴露提供商原生 UI 的逃逸口。
面向旧原生 schema 的已弃用 SDK 辅助工具仍会为现有
第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道专属的目标语义。保持共享出站宿主通用，
并通过消息适配器表面处理提供商规则：

- `messaging.inferTargetChatType({ to })` 用于决定一个已规范化目标
  在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 用于告诉核心，
  某个输入是否应直接跳到类似 id 的解析，而不是进行目录搜索。
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，
  当核心在规范化后或目录未命中后需要最终的提供商自有解析时使用。
- `messaging.resolveOutboundSessionRoute(...)` 用于在目标解析完成后，
  拥有提供商专属的会话路由构造逻辑。

推荐拆分：

- 对于应在搜索 peers/groups 之前完成的分类决策，使用 `inferTargetChatType`。
- 对于“将此视为显式/原生目标 id”的检查，使用 `looksLikeId`。
- 将 `resolveTarget` 用于提供商专属的规范化回退，而不是广泛的目录搜索。
- 将 chat id、thread id、JID、handle 和 room id 等提供商原生 id 保留在 `target` 值或提供商专属参数中，而不是放入通用 SDK 字段。

## 基于配置的目录

如果插件从配置中派生目录条目，请将该逻辑保留在
插件内部，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

适用于渠道需要基于配置的 peers/groups 的场景，例如：

- 基于 allowlist 驱动的私信 peers
- 已配置的渠道/群组映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道专属的账户检查和 id 规范化仍应保留在
插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 相同的结构：

- `{ provider }`：一个提供商条目
- `{ providers }`：多个提供商条目

当插件拥有提供商专属的模型 id、base URL 默认值，或需要认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API key 或环境变量驱动的提供商
- `profile`：存在认证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后出现的提供商在键冲突时获胜，因此插件可以有意使用相同 provider id 覆盖内置提供商条目。

兼容性：

- `discovery` 仍可作为旧式别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，建议在 `resolveAccount(...)` 之外，同时实现
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证
  已被完全实体化，并且在缺少所需密钥时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor/config
  修复流程，不应为了描述配置而需要实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始 token 值。
  返回 `tokenStatus: "available"`（以及对应的来源字段）
  就足以满足状态类命令。
- 当凭证通过 SecretRef 配置、但在当前命令路径中不可用时，
  使用 `configured_unavailable`。

这样一来，只读命令就可以报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## Package packs

一个插件目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果该 pack 列出多个扩展，则插件 id
会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，
以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保留在插件
目录内。逃逸出 package 目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时无开发依赖）。请保持插件依赖树为“纯 JS/TS”，并避免依赖需要 `postinstall` 构建的 package。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面时，或
当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`
而不是完整插件入口。这样可以在你的主插件入口还会接线工具、钩子或其他仅运行时代码时，
让启动和设置过程更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 Gateway 网关监听前的启动阶段，即便该渠道已完成配置，
也选择使用同样的 `setupEntry` 路径。

仅当 `setupEntry` 完整覆盖了 Gateway 网关开始监听前必须存在的启动表面时，
才应使用此项。实际上，这意味着设置入口
必须注册启动所依赖的每一个渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前可用的 HTTP 路由
- 任何在同一时间窗口内必须存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用
此标志。保持插件默认行为，并让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置用的契约表面辅助工具，供核心在完整渠道运行时加载前进行查询。当前的设置
提升表面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧式单账户渠道
配置提升到 `channels.<id>.accounts.*` 时，会使用这一表面。
Matrix 是当前的内置示例：当已存在命名账户时，它只会将认证/引导键移动到
某个命名提升账户中，并且它可以保留一个已配置的非规范默认账户键，而不是始终创建
`accounts.default`。

这些设置补丁适配器会让内置契约表面发现保持惰性。导入时
保持轻量；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在
插件专属前缀下。核心管理员命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析
为 `operator.admin`，即使某个插件请求更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 宣告设置/发现元数据，并通过
`openclaw.install` 宣告安装提示。这使核心目录保持无数据化。

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

除最小示例外，其他有用的 `openclaw.channel` 字段包括：

- `detailLabel`：用于更丰富目录/状态表面的次级标签
- `docsLabel`：用于覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制项
- `markdownCapable`：将该渠道标记为支持 Markdown，以用于出站格式化决策
- `exposure.configured`：设置为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设置为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部/私有，用于文档导航表面
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧式别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce 目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将 JSON 文件放到以下位置之一：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为
`"entries"` 键的旧式别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，负责摄取、组装
和压缩。使用
`api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后通过
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文
流水线，而不仅仅是增加 memory search 或钩子时，请使用此方式。

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

如果你的引擎**不**拥有压缩算法，请保持 `compact()`
已实现，并显式委托它：

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

当插件需要当前 API 不适配的行为时，不要通过私有穿透方式绕过
插件系统。请添加缺失的能力。

推荐顺序：

1. 定义核心契约
   决定哪些共享行为应由核心拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册/运行时表面
   使用最小但有用的
   类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 接线核心 + 渠道/功能消费者
   渠道和功能插件应通过核心消费该新能力，
   而不是直接导入某个供应商实现。
4. 注册供应商实现
   然后由供应商插件将其后端注册到该能力上。
5. 添加契约覆盖
   添加测试，以便随着时间推移，归属和注册形态仍保持明确。

这就是 OpenClaw 如何在保持鲜明设计立场的同时，不被硬编码到某个
供应商的世界观上。具体文件检查清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，通常实现应同时触及以下
表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- `src/plugins/runtime/*` 中的插件运行时暴露，当功能/渠道
  插件需要消费它时
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属/契约断言
- `docs/` 中的运维人员/插件文档

如果这些表面中有某一项缺失，通常意味着这个能力
尚未完全集成。

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

这让规则保持简单：

- 核心拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能/渠道插件消费运行时辅助工具
- 契约测试让归属保持明确
