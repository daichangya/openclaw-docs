---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 处理插件加载流水线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-21T05:21:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38b763841ae27137c2f2d080a3cb17ca11ee20e60dd2a95b4d6bed7dcb75e2ae
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

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

| 能力 | 注册方式 | 示例插件 |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文本推理 | `api.registerProvider(...)` | `openai`, `anthropic` |
| CLI 推理后端 | `api.registerCliBackend(...)` | `openai`, `anthropic` |
| 语音 | `api.registerSpeechProvider(...)` | `elevenlabs`, `microsoft` |
| 实时转写 | `api.registerRealtimeTranscriptionProvider(...)` | `openai` |
| 实时语音 | `api.registerRealtimeVoiceProvider(...)` | `openai` |
| 媒体理解 | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google` |
| 图像生成 | `api.registerImageGenerationProvider(...)` | `openai`, `google`, `fal`, `minimax` |
| 音乐生成 | `api.registerMusicGenerationProvider(...)` | `google`, `minimax` |
| 视频生成 | `api.registerVideoGenerationProvider(...)` | `qwen` |
| 网页抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| 网页搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息 | `api.registerChannel(...)` | `msteams`, `matrix` |

注册了零个能力、但提供钩子、工具或服务的插件属于**仅钩子**插件。这种模式仍然受到完全支持。

### 外部兼容性立场

能力模型已经在核心中落地，并且如今已被内置 / 原生插件使用，但外部插件兼容性仍需要比“已导出，因此已冻结”更严格的标准。

当前指南：

- **现有外部插件：**保持基于钩子的集成继续可用；将其视为兼容性的基线
- **新的内置 / 原生插件：**优先使用显式能力注册，而不是面向特定厂商的深度接入或新的仅钩子设计
- **采用能力注册的外部插件：**允许这样做，但除非文档明确将某项契约标记为稳定，否则应将特定于能力的辅助接口视为仍在演进中

实践规则：

- 能力注册 API 是预期的发展方向
- 在过渡期间，旧版钩子仍然是外部插件最安全、最不容易出兼容性问题的路径
- 并非所有已导出的辅助子路径都同等稳定；应优先使用文档化的狭义契约，而不是偶然暴露出来的辅助导出

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其归类为某种形态：

- **plain-capability** —— 恰好注册一种能力类型（例如仅提供商插件 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** —— 仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册能力

使用 `openclaw plugins inspect <id>` 可以查看插件的形态和能力明细。详情请参见 [CLI 参考](/cli/plugins#inspect)。

### 旧版钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容路径受到支持。现实中的旧版插件仍然依赖它。

方向如下：

- 保持其可用
- 将其文档化为旧版机制
- 涉及模型 / 提供商覆盖时，优先使用 `before_model_resolve`
- 涉及提示词变更时，优先使用 `before_prompt_build`
- 只有在真实使用量下降、并且 fixture 覆盖证明迁移安全后，才考虑移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，且插件可解析 |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用 `before_agent_start`，该机制已弃用 |
| **hard error** | 配置无效，或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会导致你的插件失效——`hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些信号也会显示在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统由四层组成：

1. **清单 + 设备发现**  
   OpenClaw 会从已配置路径、工作区根目录、全局扩展根目录以及内置扩展中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 验证**  
   核心决定某个已发现插件是启用、禁用、阻止，还是被选入某个排他性槽位（例如 memory）。
3. **运行时加载**  
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **接口消费**  
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现会明确拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性加载，并在首次调用时再注册

这样一来，插件自有的 CLI 代码仍保留在插件内部，同时 OpenClaw 仍能在解析前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置验证应当依赖**清单 / schema 元数据**完成，而不执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能够在完整运行时尚未激活前，就验证配置、解释缺失 / 已禁用的插件，并构建 UI / schema 提示。

### 渠道插件与共享 message 工具

渠道插件无需为常规聊天操作单独注册 send / edit / react 工具。OpenClaw 在核心中保留一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定发现与执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程记账，以及执行分发
- 渠道插件拥有作用域化的动作发现、能力发现，以及所有渠道特定的 schema 片段
- 渠道插件拥有提供商特定的会话对话语法，例如会话 id 如何编码线程 id，或如何从父会话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口为 `ChannelMessageActionAdapter.describeMessageTool(...)`。这一统一的发现调用允许插件同时返回其可见动作、能力和 schema 增补，从而避免这些部分彼此漂移。

当某个渠道特定的 message-tool 参数携带媒体来源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这份显式列表来应用沙箱路径规范化和出站媒体访问提示，而不必硬编码插件自有的参数名。
这里应优先使用按动作划分的映射，而不是整个渠道范围的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 之类的无关动作上被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件很重要。渠道可以根据当前账户、当前房间 / 线程 / 消息，或受信任的请求方身份来隐藏或暴露 message 动作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，以便共享 `message` 工具在当前轮次暴露正确的、由渠道拥有的接口。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再拥有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp message-action 运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从它们自有的扩展模块导入本地运行时代码。

同样的边界也适用于一般性的、以提供商命名的 SDK 接缝：核心不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果核心需要某种行为，应当要么消费该内置插件自有的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中某个狭义而通用的能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道特定投票语义或额外投票参数的首选路径

现在，核心会先等待插件投票分发拒绝该动作之后，才回退到共享投票解析，因此由插件拥有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将一个原生插件视为某个**公司**或某个**功能**的归属边界，而不是把它当作一堆互不相关集成的杂物袋。

这意味着：

- 公司插件通常应拥有该公司所有面向 OpenClaw 的接口
- 功能插件通常应拥有它所引入的完整功能接口
- 渠道应消费共享的核心能力，而不是临时重新实现提供商行为

示例：

- 内置的 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 的语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置的 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置的 `microsoft` 插件拥有 Microsoft 语音行为
- 内置的 `google` 插件拥有 Google 模型提供商行为，以及 Google 的媒体理解 + 图像生成 + 网页搜索行为
- 内置的 `firecrawl` 插件拥有 Firecrawl 网页抓取行为
- 内置的 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们各自的媒体理解后端
- 内置的 `qwen` 插件拥有 Qwen 文本提供商行为，以及媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音以及实时转写和实时语音能力，而不是直接导入厂商插件

预期的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像和未来的视频，它也只存在于一个插件中
- 其他厂商也可以用同样方式统一承载自己的接口范围
- 渠道并不关心哪个厂商插件拥有该提供商；它们消费的是核心公开的共享能力契约

这是一个关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 新增一个领域，例如视频，首要问题不应该是“哪个提供商应该硬编码视频处理？”首要问题应该是“核心的视频能力契约是什么？”一旦这个契约存在，厂商插件就可以针对它进行注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式公开它
3. 让渠道 / 功能对接这个能力
4. 让厂商插件注册具体实现

这样既能保持归属清晰，又能避免核心行为依赖单一厂商或一次性的插件特定代码路径。

### 能力分层

在判断代码应该放在哪里时，请使用以下思维模型：

- **核心能力层**：共享的编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商特定 API、鉴权、模型目录、语音合成、图像生成、未来的视频后端、使用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call 等集成，它们消费核心能力，并将其呈现在某个接口上

例如，TTS 遵循如下结构：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

对于未来的能力，也应优先采用同样的模式。

### 多能力公司插件示例

从外部来看，公司插件应当具有一致性。如果 OpenClaw 对模型、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取和网页搜索拥有共享契约，那么某个厂商就可以在一个地方统一拥有它的所有接口：

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

重要的不是确切的辅助函数名称，而是这种结构：

- 一个插件拥有厂商接口
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。这里同样适用相同的归属模型：

1. 核心定义媒体理解契约
2. 厂商插件按需注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是直接接到厂商代码上

这样可以避免把某个提供商对视频的假设固化进核心。插件拥有厂商接口；核心拥有能力契约和回退行为。

视频生成也已经采用了同样的顺序：核心拥有类型化能力契约和运行时辅助工具，而厂商插件会针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一份具体的上线检查清单？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 接口被有意设计为类型化，并集中在 `OpenClawPluginApi` 中。这个契约定义了受支持的注册点，以及插件可以依赖的运行时辅助工具。

这很重要，因为：

- 插件作者能获得一套稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册相同的提供商 id
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制内置插件的归属关系，并防止静默漂移

这里有两层强制执行：

1. **运行时注册强制执行**  
   插件注册表会在插件加载时验证注册内容。例如：重复的提供商 id、重复的语音提供商 id，以及格式错误的注册，都会产生插件诊断信息，而不是导致未定义行为。
2. **契约测试**  
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 可以显式断言归属关系。目前这被用于模型提供商、语音提供商、网页搜索提供商以及内置注册归属。

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪些接口。这样核心和渠道就能无缝组合，因为归属是声明式的、类型化的、可测试的，而不是隐含的。

### 什么应该属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力特定的
- 由核心拥有
- 可被多个插件复用
- 能被渠道 / 功能消费，而不需要了解厂商细节

不好的插件契约则是：

- 隐藏在核心中的厂商特定策略
- 绕过注册表的一次性插件逃生口
- 直接深入厂商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如果拿不准，就提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件会与 Gateway 网关**在同一进程内**运行。它们不是沙箱隔离的。一个已加载的原生插件与核心代码共享同样的进程级信任边界。

这意味着：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能会导致 gateway 网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式的安装 / 加载路径。应将工作区插件视为开发期代码，而不是生产默认项。

对于内置工作区包名，请让插件 id 默认锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更狭义的插件角色时，使用获批的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 如果某个工作区插件与某个内置插件拥有相同 id，那么当该工作区插件被启用 / 加入 allowlist 时，它会有意遮蔽内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷接口。

保持能力注册公开。收缩非契约型辅助导出：

- 内置插件特定的辅助子路径
- 不打算作为公共 API 的运行时管线子路径
- 厂商特定的便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

出于兼容性和内置插件维护的需要，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是推荐给新的第三方插件采用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的清单和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)` —— 一个旧版别名）钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令 / 运行时接口

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在同一位置调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会在运行时执行**之前**生效。如果入口逃逸出插件根目录、路径对所有人可写，或者对于非内置插件来说路径归属看起来可疑，那么候选项就会被阻止。

### Manifest 优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现已声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增补 Control UI 标签 / 占位符
- 展示安装 / 目录元数据
- 在不加载插件运行时的情况下保留轻量级激活和设置描述符

对于原生插件，运行时模块则是数据平面部分。它会注册实际行为，例如钩子、工具、命令或提供商流程。

可选的清单 `activation` 和 `setup` 区块仍然属于控制平面。它们是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活消费者现在会使用清单中的命令、渠道和提供商提示，在更广泛的注册表实例化之前先缩小插件加载范围：

- CLI 加载会收窄到拥有所请求主命令的插件
- 渠道设置 / 插件解析会收窄到拥有所请求渠道 id 的插件
- 显式的提供商设置 / 运行时解析会收窄到拥有所请求提供商 id 的插件

设置发现现在会优先使用描述符自有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先缩小候选插件范围；`setup-api` 则保留给那些仍然需要设置阶段运行时钩子的插件。如果多个已发现插件声称拥有同一个规范化后的设置提供商或 CLI 后端 id，设置查找会拒绝这个存在歧义的归属者，而不是依赖设备发现顺序。

### 加载器会缓存什么

OpenClaw 会保留一些短生命周期的进程内缓存，用于存储：

- 设备发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动和重复命令带来的开销。可以安全地将它们视为短期性能缓存，而不是持久化存储。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改随意分散的核心全局状态。它们会注册到一个中央插件注册表中。

该注册表会跟踪：

- 插件记录（身份、来源、出处、状态、诊断信息）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

随后，核心功能会从该注册表读取，而不是直接与插件模块交互。这让加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性非常重要。它意味着大多数核心接口只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可以在绑定请求获批或被拒后接收回调：

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
- `binding`：已获批请求对应的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

这个回调仅用于通知。它不会改变谁有权绑定会话，并且会在核心审批处理完成后才运行。

## 提供商运行时钩子

提供商插件现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于在运行时加载前进行低成本的提供商环境变量鉴权查找，`providerAuthAliases` 用于共享鉴权的提供商变体，`channelEnvVars` 用于在运行时加载前进行低成本的渠道环境变量 / 设置查找，另外还有 `providerAuthChoices`，用于在运行时加载前提供低成本的新手引导 / 鉴权选项标签以及 CLI flag 元数据
- 配置阶段钩子：`catalog` / 旧版 `discovery`，以及 `applyConfigDefaults`
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
  `isBinaryThinking`、`supportsXHighThinking`、`supportsAdaptiveThinking`、
  `resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、
  `buildReplayPolicy`、
  `sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClaw 仍然拥有通用智能体循环、故障切换、转录处理和工具策略。这些钩子是提供商特定行为的扩展接口，而无需实现一整套自定义推理传输层。

当某个提供商具有基于环境变量的凭证，并且通用鉴权 / 状态 / 模型选择器路径需要在不加载插件运行时的情况下感知这些凭证时，请使用清单中的 `providerAuthEnvVars`。当某个提供商 id 应复用另一个提供商 id 的环境变量、鉴权资料、基于配置的鉴权和 API key 新手引导选项时，请使用清单中的 `providerAuthAliases`。当新手引导 / 鉴权选项 CLI 接口需要在不加载提供商运行时的情况下知道该提供商的选项 id、分组标签以及简单的单 flag 鉴权接线时，请使用清单中的 `providerAuthChoices`。提供商运行时中的 `envVars` 则应保留给面向运维者的提示，例如新手引导标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有基于环境变量驱动的鉴权或设置，并且通用 shell 环境变量回退、配置 / 状态检查或设置提示需要在不加载渠道运行时的情况下感知它时，请使用清单中的 `channelEnvVars`。

### 钩子顺序与用法

对于模型 / 提供商插件，OpenClaw 会大致按以下顺序调用钩子。
“何时使用”一列是快速决策指南。

| # | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `catalog` | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中 | 当提供商拥有目录或 base URL 默认值时 |
| 2 | `applyConfigDefaults` | 在配置实例化期间应用由提供商拥有的全局配置默认值 | 当默认值依赖于鉴权模式、环境变量或提供商模型家族语义时 |
| -- | _(内置模型查找)_ | OpenClaw 会先尝试常规的注册表 / 目录路径 | _(不是插件钩子)_ |
| 3 | `normalizeModelId` | 在查找前规范化旧版或预览版 model-id 别名 | 当提供商在规范模型解析前拥有别名清理逻辑时 |
| 4 | `normalizeTransport` | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 当提供商为同一传输家族中的自定义提供商 id 拥有传输清理逻辑时 |
| 5 | `normalizeConfig` | 在运行时 / 提供商解析前规范化 `models.providers.<id>` | 当提供商需要将配置清理逻辑保留在插件中时；内置的 Google 家族辅助工具也会为受支持的 Google 配置项提供兜底 |
| 6 | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式使用量兼容性改写 | 当提供商需要基于端点的原生流式使用量元数据修复时 |
| 7 | `resolveConfigApiKey` | 在加载运行时鉴权前，为配置提供商解析环境变量标记鉴权 | 当提供商拥有由自己管理的环境变量标记 API key 解析逻辑时；`amazon-bedrock` 在这里也有内置的 AWS 环境变量标记解析器 |
| 8 | `resolveSyntheticAuth` | 在不持久化明文的前提下暴露本地 / 自托管或基于配置的鉴权 | 当提供商可以通过合成 / 本地凭证标记运行时 |
| 9 | `resolveExternalAuthProfiles` | 叠加由提供商拥有的外部鉴权资料；默认 `persistence` 为 `runtime-only`，适用于 CLI / 应用自有凭证 | 当提供商需要复用外部鉴权凭证，而不持久化复制来的 refresh token 时 |
| 10 | `shouldDeferSyntheticProfileAuth` | 将已存储的合成资料占位符降到环境变量 / 基于配置的鉴权之后 | 当提供商存储了不应获得最高优先级的合成占位资料时 |
| 11 | `resolveDynamicModel` | 为本地注册表中尚不存在的提供商自有模型 id 提供同步回退解析 | 当提供商接受任意上游模型 id 时 |
| 12 | `prepareDynamicModel` | 先执行异步预热，然后再次运行 `resolveDynamicModel` | 当提供商在解析未知 id 之前需要网络元数据时 |
| 13 | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型前做最终改写 | 当提供商需要传输改写，但仍使用核心传输层时 |
| 14 | `contributeResolvedModelCompat` | 为通过另一兼容传输承载的厂商模型提供兼容标记 | 当提供商能在代理传输上识别自己的模型，而无需接管该提供商时 |
| 15 | `capabilities` | 由提供商拥有的转录 / 工具元数据，供共享核心逻辑使用 | 当提供商需要转录 / 提供商家族特有行为时 |
| 16 | `normalizeToolSchemas` | 在嵌入式 runner 看到工具 schema 之前先进行规范化 | 当提供商需要传输家族级别的 schema 清理时 |
| 17 | `inspectToolSchemas` | 在规范化之后暴露由提供商拥有的 schema 诊断信息 | 当提供商希望给出关键字警告，而不想让核心学习提供商特定规则时 |
| 18 | `resolveReasoningOutputMode` | 选择原生或带标签的 reasoning-output 契约 | 当提供商需要使用带标签的推理 / 最终输出，而不是原生字段时 |
| 19 | `prepareExtraParams` | 在通用流式选项包装器之前进行请求参数规范化 | 当提供商需要默认请求参数或每个提供商的参数清理时 |
| 20 | `createStreamFn` | 用自定义传输层完全替换正常的流式路径 | 当提供商需要自定义线协议，而不仅仅是包装器时 |
| 21 | `wrapStreamFn` | 在应用完通用包装器之后再包装流式函数 | 当提供商需要请求头 / 请求体 / 模型兼容包装器，但不需要自定义传输层时 |
| 22 | `resolveTransportTurnState` | 附加原生的逐轮传输头或元数据 | 当提供商希望通用传输发送提供商原生的轮次标识时 |
| 23 | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头或会话冷却策略 | 当提供商希望通用 WS 传输调整会话头或回退策略时 |
| 24 | `formatApiKey` | 鉴权资料格式化器：将已存储资料转换为运行时 `apiKey` 字符串 | 当提供商存储了额外鉴权元数据，并需要自定义运行时 token 形态时 |
| 25 | `refreshOAuth` | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | 当提供商不适配共享的 `pi-ai` 刷新器时 |
| 26 | `buildAuthDoctorHint` | 当 OAuth 刷新失败时追加修复提示 | 当提供商在刷新失败后需要提供商自有的鉴权修复指引时 |
| 27 | `matchesContextOverflowError` | 由提供商拥有的上下文窗口溢出匹配器 | 当提供商有通用启发式无法识别的原始溢出错误时 |
| 28 | `classifyFailoverReason` | 由提供商拥有的故障切换原因分类 | 当提供商可以将原始 API / 传输错误映射为限流 / 过载等类型时 |
| 29 | `isCacheTtlEligible` | 面向代理 / 回传提供商的提示词缓存策略 | 当提供商需要代理特定的缓存 TTL 门控时 |
| 30 | `buildMissingAuthMessage` | 替代通用缺失鉴权恢复消息 | 当提供商需要提供商特定的缺失鉴权恢复提示时 |
| 31 | `suppressBuiltInModel` | 过时上游模型抑制，并可选附带面向用户的错误提示 | 当提供商需要隐藏过时的上游条目或用厂商提示替代它们时 |
| 32 | `augmentModelCatalog` | 在发现之后追加合成 / 最终目录条目 | 当提供商需要在 `models list` 和选择器中加入合成的前向兼容条目时 |
| 33 | `isBinaryThinking` | 为二元 thinking 提供商提供开 / 关推理切换 | 当提供商仅暴露二元的 thinking 开 / 关时 |
| 34 | `supportsXHighThinking` | 为选定模型提供 `xhigh` 推理支持 | 当提供商只希望在部分模型上支持 `xhigh` 时 |
| 35 | `supportsAdaptiveThinking` | 为选定模型提供 `adaptive` thinking 支持 | 当提供商只希望在由其管理自适应 thinking 的模型上显示 `adaptive` 时 |
| 36 | `resolveDefaultThinkingLevel` | 为特定模型家族解析默认 `/think` 级别 | 当提供商拥有某个模型家族的默认 `/think` 策略时 |
| 37 | `isModernModelRef` | 用于实时资料过滤和 smoke 选择的现代模型匹配器 | 当提供商拥有实时 / smoke 首选模型匹配逻辑时 |
| 38 | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时 token / key | 当提供商需要进行 token 交换或获取短生命周期请求凭证时 |
| 39 | `resolveUsageAuth` | 为 `/usage` 及相关状态接口解析使用量 / 计费凭证 | 当提供商需要自定义使用量 / 配额 token 解析，或使用不同的使用量凭证时 |
| 40 | `fetchUsageSnapshot` | 在鉴权解析完成后获取并规范化提供商特定的使用量 / 配额快照 | 当提供商需要提供商特定的使用量端点或负载解析器时 |
| 41 | `createEmbeddingProvider` | 为 memory / 搜索构建由提供商拥有的嵌入适配器 | 当 memory 嵌入行为应归属于提供商插件时 |
| 42 | `buildReplayPolicy` | 返回一个控制该提供商转录处理方式的重放策略 | 当提供商需要自定义转录策略时（例如移除 thinking 块） |
| 43 | `sanitizeReplayHistory` | 在通用转录清理之后改写重放历史 | 当提供商在共享压缩辅助工具之外，还需要提供商特定的重放改写时 |
| 44 | `validateReplayTurns` | 在嵌入式 runner 之前对重放轮次做最终校验或重塑 | 当提供商传输在通用清理之后仍需要更严格的轮次校验时 |
| 45 | `onModelSelected` | 在模型被选中后执行由提供商拥有的副作用 | 当某个模型激活后，提供商需要进行遥测或维护提供商自有状态时 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后再继续尝试其他具备相应钩子能力的提供商插件，直到某个插件实际修改了 model id 或 transport / config。这样可以让别名 / 兼容性提供商 shim 继续工作，而无需调用方知道具体是哪个内置插件拥有这项改写逻辑。如果没有任何提供商钩子改写某个受支持的 Google 家族配置项，内置的 Google 配置规范化器仍会应用这类兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展。这些钩子适用于仍运行在 OpenClaw 常规推理循环上的提供商行为。

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
  `supportsAdaptiveThinking`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`，
  以及 `wrapStreamFn`，因为它拥有 Claude 4.6 前向兼容、
  提供商家族提示、鉴权修复指引、使用量端点集成、
  提示词缓存资格、鉴权感知配置默认值、Claude
  默认 / 自适应 thinking 策略，以及面向 beta headers、`/fast` / `serviceTier` 和 `context1m` 的 Anthropic 特定流式整形能力。
- Anthropic 的 Claude 特定流式辅助工具目前仍保留在该内置插件自己的公共 `api.ts` / `contract-api.ts` 接缝中。这个包接口会导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及更底层的 Anthropic 包装器构建器，而不是为了某个提供商的 beta-header 规则去扩展通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，外加 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接 OpenAI
  `openai-completions` -> `openai-responses` 规范化、感知 Codex 的鉴权
  提示、Spark 抑制、合成的 OpenAI 列表条目，以及 GPT-5 thinking /
  实时模型策略；`openai-responses-defaults` 流式家族则拥有共享的原生 OpenAI Responses 包装器，用于处理 attribution headers、
  `/fast` / `serviceTier`、文本详细度、原生 Codex 网页搜索、
  reasoning 兼容负载整形，以及 Responses 上下文管理。
- OpenRouter 使用 `catalog`，以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为这个提供商是透传型的，可能会在 OpenClaw 的静态目录更新之前就暴露新的
  model id；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以避免将提供商特定的请求头、路由元数据、reasoning 补丁和
  提示词缓存策略放进核心。它的重放策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流式家族
  则拥有代理推理注入以及对不支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，外加 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，
  因为它需要提供商自有的设备登录、模型回退行为、Claude 转录特性、GitHub token -> Copilot token 交换，以及提供商自有的使用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，外加
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  仍然运行在核心 OpenAI 传输层之上，但拥有其传输 / base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  合成 Codex 目录条目，以及 ChatGPT 使用量端点集成；它
  与直接 OpenAI 共用同一个 `openai-responses-defaults` 流式家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` 重放家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini 重放校验、bootstrap 重放清理、带标签的
  reasoning-output 模式，以及现代模型匹配，而
  `google-thinking` 流式家族拥有 Gemini thinking 负载规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理 token 格式化、token 解析和配额端点接线。
- Anthropic Vertex 通过
  `anthropic-by-model` 重放家族使用 `buildReplayPolicy`，以便将 Claude 特定的重放清理限定在 Claude id 范围内，而不是作用于每一个 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveDefaultThinkingLevel`，因为它拥有
  面向 Anthropic-on-Bedrock 流量的 Bedrock 特定限流 / 未就绪 / 上下文溢出错误分类；
  它的重放策略仍然与同一个仅限 Claude 的 `anthropic-by-model` 防护共享。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过 `buildReplayPolicy`
  使用 `passthrough-gemini` 重放家族，因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，并且需要 Gemini
  thought-signature 清理，但不需要原生 Gemini 重放校验或
  bootstrap 改写。
- MiniMax 通过
  `hybrid-anthropic-openai` 重放家族使用 `buildReplayPolicy`，因为一个提供商同时拥有 Anthropic-message 和 OpenAI 兼容语义；它在 Anthropic 侧保留仅限 Claude 的 thinking 块丢弃逻辑，同时将 reasoning 输出模式覆盖回原生，而 `minimax-fast-mode` 流式家族则在共享流式路径上拥有 fast-mode 模型改写能力。
- Moonshot 使用 `catalog`，外加 `wrapStreamFn`，因为它仍使用共享
  OpenAI 传输层，但需要提供商自有的 thinking 负载规范化；`moonshot-thinking` 流式家族会将配置和 `/think` 状态映射到它的原生二元 thinking 负载上。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要提供商自有的请求头、
  reasoning 负载规范化、Gemini 转录提示，以及 Anthropic
  cache-TTL 门控；`kilocode-thinking` 流式家族则将 Kilo thinking 注入保留在共享代理流式路径上，同时跳过 `kilo/auto` 和其他不支持显式推理负载的代理 model id。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking 用户体验、
  现代模型匹配，以及使用量鉴权 + 配额获取；`tool-stream-default-on` 流式家族则将默认开启的 `tool_stream` 包装器从逐提供商手写胶水代码中分离出来。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode
  别名改写、默认 `tool_stream`、严格工具 / 推理负载
  清理、用于插件自有工具的回退鉴权复用、前向兼容的 Grok
  模型解析，以及由提供商拥有的兼容性补丁，例如 xAI 工具 schema
  配置、受支持之外的 schema 关键字、原生 `web_search`，以及 HTML 实体工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 只使用 `capabilities`，以便将转录 / 工具特性保留在核心之外。
- 仅目录型的内置提供商，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，只使用
  `catalog`。
- Qwen 使用 `catalog` 处理其文本提供商，同时为其多模态接口注册共享的媒体理解和视频生成能力。
- MiniMax 和 Xiaomi 使用 `catalog` 加上使用量钩子，因为它们的 `/usage`
  行为归插件所有，尽管推理仍通过共享传输层运行。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问选定的核心辅助工具。以 TTS 为例：

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

- `textToSpeech` 返回适用于文件 / 语音便笺接口的常规核心 TTS 输出负载。
- 它使用核心 `messages.tts` 配置和提供商选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为各提供商自行完成重采样 / 编码。
- `listVoices` 对每个提供商来说都是可选的。可将其用于厂商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以支持感知提供商的选择器。
- OpenAI 和 ElevenLabs 当前支持电话场景。Microsoft 不支持。

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

- 将 TTS 策略、回退和回复交付保留在核心中。
- 使用语音提供商承载由厂商拥有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 首选的归属模型是面向公司的：随着 OpenClaw 增加这些
  能力契约，一个厂商插件可以统一拥有文本、语音、图像和未来的媒体提供商。

对于图像 / 音频 / 视频理解，插件应注册一个类型化的
media-understanding 提供商，而不是使用通用的 key/value 包：

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
- 将厂商行为保留在提供商插件中。
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已经遵循相同模式：
  - 核心拥有能力契约和运行时辅助工具
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能 / 渠道插件消费 `api.runtime.videoGeneration.*`

对于 media-understanding 运行时辅助工具，插件可以调用：

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

对于音频转写，插件既可以使用 media-understanding 运行时，也可以使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享接口。
- 它使用核心媒体理解音频配置（`tools.media.audio`）以及提供商回退顺序。
- 当未产生转写输出时，返回 `{ text: undefined }`（例如输入被跳过 / 不受支持）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍然作为兼容性别名保留。

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

- `provider` 和 `model` 是每次运行的可选覆盖项，不会持久化为会话变更。
- OpenClaw 只会为受信任调用方接受这些覆盖字段。
- 对于插件自有的回退运行，运维者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定规范 `provider/model` 目标，或使用 `"*"` 显式允许任意目标。
- 不受信任插件的子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于网页搜索，插件可以消费共享运行时辅助工具，而不是深入接入智能体工具接线：

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
- 使用网页搜索提供商承载厂商特定的搜索传输。
- `api.runtime.webSearch.*` 是需要搜索行为但不依赖智能体工具包装器的功能 / 渠道插件的首选共享接口。

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
- `auth`：必填。使用 `"gateway"` 要求正常 Gateway 网关鉴权，或使用 `"plugin"` 表示由插件管理鉴权 / webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己已有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。请只在相同鉴权级别内保留 `exact` / `prefix` 的贯穿链。
- `auth: "plugin"` 路由**不会**自动接收运维者运行时作用域。它们用于由插件管理的 webhook / 签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内执行，但该作用域是有意保守的：
  - 共享密钥 bearer 鉴权（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 携带受信任身份的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）只有在显式存在该 header 时，才会接受 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实践规则：不要假设 gateway 鉴权的插件路由天然就是管理员接口。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的鉴权模式，并记录清楚显式 `x-openclaw-scopes` header 契约。

## 插件 SDK 导入路径

在编写插件时，应使用 SDK 子路径，而不是单体的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于插件注册原语。
- `openclaw/plugin-sdk/core` 用于通用的共享插件侧契约。
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
  `openclaw/plugin-sdk/webhook-ingress`，用于共享的设置 / 鉴权 / 回复 / webhook
  接线。`channel-inbound` 是防抖、提及匹配、
  入站提及策略辅助工具、信封格式化，以及入站信封
  上下文辅助工具的共享归属位置。
  `channel-setup` 是狭义的可选安装设置接缝。
  `setup-runtime` 是 `setupEntry` /
  延迟启动所使用的运行时安全设置接口，其中包括导入安全的设置补丁适配器。
  `setup-adapter-runtime` 是感知环境变量的账户设置适配器接缝。
  `setup-tools` 是一个小型 CLI / 归档 / 文档辅助接口（`formatCliCommand`、
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
  `telegram-command-config` 是 Telegram 自定义
  命令规范化 / 校验的狭义公共接缝，即使内置
  Telegram 契约接口暂时不可用，它也会保持可用。
  `text-runtime` 是共享的文本 / Markdown / 日志接缝，其中包括
  对助手可见文本的剥离、Markdown 渲染 / 分块辅助工具、脱敏
  辅助工具、directive-tag 辅助工具，以及安全文本工具。
- 审批特定的渠道接缝应优先在插件上使用单一 `approvalCapability`
  契约。随后核心会通过这一项能力来读取审批鉴权、交付、渲染、
  原生路由和惰性原生处理器行为，而不是把审批行为混入无关的插件字段。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，目前仅作为
  旧插件的兼容性 shim 保留。新代码应改为导入更狭义的
  通用原语，仓库代码也不应新增对该 shim 的导入。
- 内置扩展内部实现仍为私有。外部插件应只使用
  `openclaw/plugin-sdk/*` 子路径。OpenClaw 核心 / 测试代码可以使用
  插件包根目录下的仓库公共入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`，以及范围狭义的文件，例如
  `login-qr-api.js`。绝不要从核心或其他扩展中导入插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具 / 类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置提供商示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 处理 Claude 流式辅助工具，例如
    `wrapAnthropicProviderStream`、beta-header 辅助工具，以及 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 处理提供商构建器、默认模型辅助工具，以及
    realtime 提供商构建器。
  - OpenRouter 使用 `api.js` 处理其提供商构建器以及新手引导 / 配置
    辅助工具，而 `register.runtime.js` 仍可为仓库内部使用重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- 由 facade 加载的公共入口点在存在活动运行时配置快照时会优先使用它，否则当 OpenClaw 尚未提供运行时快照时，会回退到磁盘上的已解析配置文件。
- 通用共享原语仍然是首选的公共 SDK 契约。仍然保留一小组保留的、用于兼容的内置渠道品牌化辅助接缝。应将这些视为内置维护 / 兼容性接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或插件本地的 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根 `openclaw/plugin-sdk` barrel。
- 优先使用狭义且稳定的原语。较新的 setup / pairing / reply /
  feedback / contract / inbound / threading / command / secret-input / webhook / infra /
  allowlist / status / message-tool 子路径，是新的内置和外部插件工作的预期契约。
  目标解析 / 匹配应放在 `openclaw/plugin-sdk/channel-targets`。
  消息动作门控和 reaction message-id 辅助工具应放在
  `openclaw/plugin-sdk/channel-actions`。
- 内置扩展特定的辅助 barrel 默认并不稳定。如果某个
  辅助工具只被某个内置扩展需要，应将其保留在该扩展本地的
  `api.js` 或 `runtime-api.js` 接缝之后，而不是提升到
  `openclaw/plugin-sdk/<extension>` 中。
- 新的共享辅助接口应是通用的，而不是带渠道品牌的。共享目标
  解析应放在 `openclaw/plugin-sdk/channel-targets`；渠道特定
  内部实现应保留在所属插件本地的 `api.js` 或 `runtime-api.js`
  接缝之后。
- 像 `image-generation`、
  `media-understanding` 和 `speech` 这样的能力特定子路径之所以存在，是因为内置 / 原生插件今天就在使用它们。但它们的存在本身并不意味着每个导出的辅助工具都是长期冻结的外部契约。

## Message 工具 schema

插件应拥有渠道特定的 `describeMessageTool(...)` schema
增补。将提供商特定字段保留在插件中，而不是放入共享核心。

对于共享的可移植 schema 片段，请复用通过
`openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()` 用于按钮网格样式负载
- `createMessageToolCardSchema()` 用于结构化卡片负载

如果某个 schema 形状只对某一个提供商有意义，请在该插件自己的
源码中定义它，而不是把它提升到共享 SDK 中。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站宿主的通用性，并通过消息适配器接口承载提供商规则：

- `messaging.inferTargetChatType({ to })` 决定某个规范化目标在目录查找之前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应跳过目录搜索，直接进入类似 id 的解析流程。
- `messaging.targetResolver.resolveTarget(...)` 是在规范化之后或目录未命中之后，当核心需要提供商自有的最终解析时的插件回退路径。
- `messaging.resolveOutboundSessionRoute(...)` 则在目标解析完成后拥有提供商特定的会话路由构造逻辑。

推荐拆分方式：

- 对于应在搜索 peers / groups 之前完成的分类决策，使用 `inferTargetChatType`。
- 对于“将其视为显式 / 原生目标 id”的判断，使用 `looksLikeId`。
- 将 `resolveTarget` 用于提供商特定的规范化回退，而不是广义的目录搜索。
- 将聊天 id、线程 id、JID、handle 和 room
  id 等提供商原生 id 保留在 `target` 值或提供商特定参数中，而不是放在通用 SDK 字段中。

## 基于配置的目录

如果插件需要从配置中派生目录条目，应将这部分逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

适用场景包括渠道需要基于配置支持的 peers / groups，例如：

- 由 allowlist 驱动的私信 peers
- 已配置的渠道 / 群组映射
- 账户作用域下的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回的结构与 OpenClaw 写入
`models.providers` 的结构相同：

- `{ provider }` 表示一个提供商条目
- `{ providers }` 表示多个提供商条目

当插件拥有提供商特定的模型 id、base URL 默认值或受鉴权控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：纯 API key 或环境变量驱动的提供商
- `profile`：当存在鉴权资料时出现的提供商
- `paired`：会合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后出现的提供商会在键冲突时胜出，因此插件可以有意用相同提供商 id 覆盖某个内置提供商条目。

兼容性：

- `discovery` 仍作为旧版别名可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先同时实现
`plugin.config.inspectAccount(cfg, accountId)` 和 `resolveAccount(...)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证
  已经完全实例化，并且在缺少必需 secret 时可以快速失败。
- 像 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor / config
  修复流程这样的只读命令路径，不应为了描述配置而必须实例化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始 token 值。对于状态类命令，返回 `tokenStatus: "available"`（以及对应的来源字段）就足够了。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就能报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## 包插件包

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

每个条目都会变成一个插件。如果该包列出了多个扩展，插件 id
会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须仍位于插件目录内部。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖
（无生命周期脚本，运行时无开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免使用需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量的仅设置模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置接口，或者
某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`
而不是完整插件入口。这样在你的主插件入口还会接线工具、钩子或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 Gateway 网关监听前的启动阶段，即使渠道已经配置完成，也选择走同一个 `setupEntry` 路径。

只有当 `setupEntry` 能完全覆盖 gateway 网关开始监听前必须存在的启动接口时，才应使用它。实践中，这意味着设置入口必须注册启动阶段依赖的每个渠道自有能力，例如：

- 渠道注册本身
- gateway 网关开始监听前必须可用的所有 HTTP 路由
- 在同一时间窗口内必须存在的所有 gateway 方法、工具或服务

如果完整入口仍然拥有任何必需的启动能力，就不要启用这个 flag。请保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅设置阶段的契约接口辅助工具，供核心在完整渠道运行时加载之前查询。当前的设置提升接口为：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用这组接口。Matrix 是当前的内置示例：当已存在命名账户时，它只会把鉴权 / bootstrap 键移动到某个命名提升账户中，并且可以保留一个已配置的非规范默认账户键，而不是总是创建 `accounts.default`。

这些设置补丁适配器让内置契约接口发现保持惰性。导入时保持轻量；提升接口只在首次使用时加载，而不会在模块导入时重新进入内置渠道启动逻辑。

当这些启动接口包含 gateway 网关 RPC 方法时，请将它们保留在插件特定前缀下。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终解析为 `operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 声明设置 / 发现元数据，并通过 `openclaw.install` 声明安装提示。这样可以让核心目录保持无数据状态。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（自托管）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "通过 Nextcloud Talk webhook 机器人提供自托管聊天。",
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

除了最小示例之外，还有一些有用的 `openclaw.channel` 字段：

- `detailLabel`：用于更丰富目录 / 状态接口的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于之显示的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面的文案控制项
- `markdownCapable`：将该渠道标记为支持 Markdown，以便出站格式化决策使用
- `exposure.configured`：当设置为 `false` 时，在已配置渠道列表接口中隐藏该渠道
- `exposure.setup`：当设置为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部 / 私有，以供文档导航界面使用
- `showConfigured` / `showInSetup`：出于兼容性仍接受的旧版别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如某个 MPM
注册表导出）。只需将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（使用逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，负责摄取、组装和压缩。可在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是增加 memory 搜索或钩子时，请使用这种方式。

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

当某个插件需要当前 API 无法覆盖的行为时，不要通过私有深度接入来绕过插件系统。应当添加缺失的能力。

推荐顺序：

1. 定义核心契约  
   明确核心应拥有哪些共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化插件注册 / 运行时接口  
   用最小且有用的类型化能力接口扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线核心 + 渠道 / 功能消费者  
   渠道和功能插件应通过核心消费新能力，而不是直接导入某个厂商实现。
4. 注册厂商实现  
   然后由厂商插件针对该能力注册它们的后端实现。
5. 添加契约覆盖  
   添加测试，以便长期保持归属关系和注册形态的显式性。

这就是 OpenClaw 保持有明确设计取向、又不被某个提供商世界观硬编码绑死的方式。具体文件检查清单和完整示例请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加新能力时，实现通常应同时涉及以下接口：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，位于 `src/plugins/runtime/*` 中的插件运行时暴露层
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中面向运维者 / 插件的文档

如果这些接口中有某一项缺失，通常意味着该能力尚未完全接入。

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
- 契约测试让归属关系保持显式
