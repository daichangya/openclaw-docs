---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或所有权边界
    - 处理插件加载流程或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、所有权、契约、加载流程和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-24T06:33:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面的聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向终端用户的指南，介绍如何添加、启用和故障排除插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    首个插件教程，包含最小可工作的清单。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建一个消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建一个模型提供商插件。
  </Card>
  <Card title="SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考。
  </Card>
</CardGroup>

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

| 能力 | 注册方式 | 示例插件 |
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
| Gateway 网关发现 | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

如果某个插件注册了零个能力，但提供了钩子、工具、发现服务或后台服务，那么它就是一个**仅 legacy 钩子**插件。该模式目前仍然得到完整支持。

### 外部兼容性立场

能力模型已经在核心中落地，并被当前的内置 / 原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况 | 指引 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于钩子的集成继续工作；这是兼容性基线。 |
| 新的内置 / 原生插件 | 优先使用显式能力注册，而不是面向特定厂商的直连方式，或新的仅钩子设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档明确标记为稳定，否则应将特定能力的辅助接口视为仍在演进中。 |

能力注册是预期的发展方向。在过渡期间，legacy 钩子仍然是对外部插件最安全、最不容易破坏的路径。导出的辅助子路径并不完全等价——相比偶然暴露的辅助导出，应优先使用范围更窄、文档化的契约。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不仅仅是静态元数据）将其归类为某种形态：

- **plain-capability**：恰好注册一种能力类型（例如仅提供商插件 `mistral`）。
- **hybrid-capability**：注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）。
- **hook-only**：仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务。
- **non-capability**：注册工具、命令、服务或路由，但不注册任何能力。

使用 `openclaw plugins inspect <id>` 查看插件的形态和能力细分。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### Legacy 钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容路径而受到支持。现实中的 legacy 插件仍然依赖它。

方向如下：

- 保持其可用
- 在文档中将其标记为 legacy
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降，并且夹具覆盖证明迁移安全后，才移除它

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，插件可解析 |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了已弃用的 `before_agent_start` |
| **hard error** | 配置无效或插件加载失败 |

目前，`hook-only` 和 `before_agent_start` 都不会导致你的插件损坏：`hook-only` 只是提示，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **清单 + 设备发现**
   OpenClaw 会从已配置路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会优先读取原生 `openclaw.plugin.json` 清单以及受支持的 bundle 清单。
2. **启用 + 验证**
   核心会决定某个已发现插件是启用、禁用、阻止，还是被选中用于某个独占槽位（例如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被规范化为注册表记录，而无需导入运行时代码。
4. **接口消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现会拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，并在首次调用时注册

这样既能让插件拥有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置验证应当依赖**清单 / schema 元数据**完成，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 能够在完整运行时尚未激活前，就验证配置、解释缺失 / 已禁用插件，并构建 UI / schema 提示。

### 激活规划

激活规划属于控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，先询问哪些插件与某个具体命令、提供商、渠道、路由、智能体 harness 或能力相关。

规划器会保持当前清单行为的兼容性：

- `activation.*` 字段是显式的规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子仍然是清单所有权回退来源
- 仅 id 的规划器 API 仍然对现有调用方可用
- 规划 API 会报告原因标签，以便诊断区分显式提示和所有权回退

不要把 `activation` 视为生命周期钩子，也不要把它视为 `register(...)` 的替代品。它只是用于缩小加载范围的元数据。当现有所有权字段已经足以描述关系时，应优先使用它们；只有在需要额外规划器提示时，才使用 `activation`。

### 渠道插件和共享 message 工具

对于常规聊天操作，渠道插件不需要单独注册发送 / 编辑 / 响应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具，而渠道插件负责其背后的渠道特定发现与执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记和执行分派
- 渠道插件拥有作用域动作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件拥有提供商特定的会话对话语法，例如对话 id 如何编码线程 id，或如何从父对话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件将其可见动作、能力和 schema 扩展一起返回，从而避免这些部分彼此漂移。

当某个渠道特定的消息工具参数携带媒体来源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心会使用这份显式列表来应用沙箱路径规范化和出站媒体访问提示，而不是硬编码插件拥有的参数名。
这里应优先使用按动作划分的映射，而不是一个按渠道统一的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 之类的不相关动作上被规范化。

核心会将运行时作用域传入这个发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感型插件很重要。渠道可以根据活动账户、当前房间 / 线程 / 消息，或受信任的请求者身份，隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，以便共享 `message` 工具在当前轮次暴露正确的渠道拥有接口。

对于渠道拥有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再在 `src/agents/tools` 下拥有 Discord、Slack、Telegram 或 WhatsApp 的消息动作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从各自扩展拥有的模块中导入本地运行时代码。

同样的边界也适用于一般性的提供商命名 SDK 接缝：核心不应导入面向 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道特定便捷 barrel。如果核心需要某种行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中范围更窄的通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型的渠道的共享基线
- `actions.handleAction("poll")` 是用于渠道特定投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才回退到共享投票解析，因此由插件拥有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力所有权模型

OpenClaw 将原生插件视为**公司**或**功能**的所有权边界，而不是一堆彼此无关的集成的集合。

这意味着：

- 一个公司插件通常应拥有该公司的所有面向 OpenClaw 的接口
- 一个功能插件通常应拥有它引入的完整功能接口
- 渠道应消费共享的核心能力，而不是临时重新实现提供商行为

<Accordion title="内置插件中的所有权模式示例">
  - **供应商多能力**：`openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理以及媒体理解、图像生成和网页搜索。`qwen` 拥有文本推理以及媒体理解和视频生成。
  - **供应商单能力**：`elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有网页抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  - **功能插件**：`voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件。
</Accordion>

预期的最终状态是：

- 即使 OpenAI 横跨文本模型、语音、图像和未来的视频，也应存在于一个插件中
- 其他供应商也可以对自己的接口范围采用相同方式
- 渠道不关心哪个供应商插件拥有该提供商；它们只消费核心暴露的共享能力契约

这是关键区别：

- **plugin** = 所有权边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 添加了一个新领域，例如视频，第一个问题不应该是“哪个提供商应该硬编码视频处理？”第一个问题应该是“核心的视频能力契约是什么？”一旦该契约存在，供应商插件就可以针对它进行注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式将其暴露出来
3. 让渠道 / 功能对接该能力
4. 让供应商插件注册实现

这样既能保持所有权明确，又能避免核心行为依赖于某个单一供应商或某条一次性的插件特定代码路径。

### 能力分层

在决定代码归属位置时，可使用以下心智模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **供应商插件层**：供应商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费核心能力并将其呈现在某个界面上

例如，TTS 遵循以下结构：

- 核心拥有回复时 TTS 策略、回退顺序、偏好设置和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来能力也应优先采用同样的模式。

### 多能力公司插件示例

从外部看，一个公司插件应当具有一致性。如果 OpenClaw 具有用于模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和网页搜索的共享契约，那么某个供应商可以在一个地方拥有其全部接口：

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

- 一个插件拥有该供应商接口
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。相同的所有权模型也适用于这里：

1. 核心定义媒体理解契约
2. 供应商插件根据适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享的核心行为，而不是直接对接供应商代码

这样可以避免把某个提供商的视频假设固化到核心中。插件拥有供应商接口；核心拥有能力契约和回退行为。

视频生成已经采用了同样的顺序：核心拥有类型化能力契约和运行时辅助工具，而供应商插件通过 `api.registerVideoGenerationProvider(...)` 针对它注册实现。

需要一个具体的发布检查清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 接口被有意设计为类型化，并集中在
`OpenClawPluginApi` 中。这个契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者可以获得一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册同一个 provider id
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件的所有权，并防止无声漂移

这里有两层强制执行：

1. **运行时注册强制执行**
   插件注册表会在插件加载时验证注册内容。例如：重复的 provider id、重复的语音提供商 id，以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**
   内置插件会在测试运行期间被记录到契约注册表中，因此 OpenClaw 可以显式断言所有权。如今，这已被用于模型提供商、语音提供商、网页搜索提供商以及内置注册所有权。

实际效果是，OpenClaw 可以预先知道哪个插件拥有哪个接口。这使得核心和渠道可以无缝组合，因为所有权是声明式、类型化且可测试的，而不是隐式的。

### 什么内容应属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力特定的
- 由核心拥有的
- 可被多个插件复用
- 可被渠道 / 功能消费，而无需了解供应商细节

不好的插件契约包括：

- 隐藏在核心中的供应商特定策略
- 绕过注册表的一次性插件逃生口
- 直接深入供应商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或
  `api.runtime` 的临时运行时对象

如果有疑问，请提升抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件会与 Gateway 网关**在同一进程内**运行。它们不是沙箱隔离的。已加载的原生插件与核心代码具有相同的进程级信任边界。

这意味着：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容的 bundle 默认更安全，因为 OpenClaw 目前将其视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式的安装 / 加载路径。应将工作区插件视为开发阶段代码，而不是生产默认值。

对于内置工作区包名，应让插件 id 默认锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄插件角色时，使用经批准的类型化后缀，例如
`-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 与内置插件具有相同 id 的工作区插件，在被启用 / 加入 allowlist 时，会有意覆盖内置副本。
- 这对于本地开发、补丁测试和热修复来说是正常且有用的。
- 内置插件的信任是根据源快照来解析的——即加载时磁盘上的清单和代码——而不是根据安装元数据。损坏或被替换的安装记录不能在实际源码声明范围之外，悄悄扩大内置插件的信任接口。

## 导出边界

OpenClaw 导出的是能力，而不是实现便利性。

应保持能力注册公开。应精简非契约辅助导出：

- 内置插件特定的辅助子路径
- 无意作为公共 API 的运行时管线子路径
- 供应商特定的便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

出于兼容性和内置插件维护需求，一些内置插件辅助子路径仍然保留在生成的 SDK 导出映射中。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将它们视为保留的实现细节导出，而不是推荐给新的第三方插件使用的 SDK 模式。

## 内部机制与参考

有关加载流程、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、消息工具 schema、渠道目标解析、提供商目录、上下文引擎插件，以及新增能力的指南，请参见
[插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [插件清单](/zh-CN/plugins/manifest)
