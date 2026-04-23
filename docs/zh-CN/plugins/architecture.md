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
    generated_at: "2026-04-23T17:43:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 126448800be1bd0ce37ab166bc01b5e229f995e872616aff62b70ffe6f1925b2
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面的聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向终端用户的指南，介绍如何添加、启用以及故障排除插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    首个插件教程，包含最小可运行 manifest。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建一个消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建一个模型提供商插件。
  </Card>
  <Card title="SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    导入映射与注册 API 参考。
  </Card>
</CardGroup>

## 公开能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

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
| Web 抓取 | `api.registerWebFetchProvider(...)` | `firecrawl` |
| Web 搜索 | `api.registerWebSearchProvider(...)` | `google` |
| 渠道 / 消息传递 | `api.registerChannel(...)` | `msteams`, `matrix` |

如果一个插件注册了零个能力，但提供了钩子、工具或服务，那么它就是一个**仅 legacy 钩子**插件。这种模式仍然被完全支持。

### 外部兼容性立场

能力模型已经在核心中落地，并已被当前的内置 / 原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况 | 指引 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于钩子的集成继续可用；这是兼容性的基线。 |
| 新的内置 / 原生插件 | 优先使用显式能力注册，而不是针对特定供应商的深度接入或新的仅钩子设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档将其标记为稳定，否则应将特定能力的辅助接口视为仍在演进中。 |

能力注册是预期的发展方向。在过渡期间，对于外部插件来说，legacy 钩子仍是最安全、最不易破坏兼容性的路径。并非所有导出的辅助子路径都同等稳定——优先选择范围明确、文档化的契约，而不是偶然导出的辅助接口。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不只是静态元数据）将其归类为一种形态：

- **plain-capability**：只注册恰好一种能力类型（例如像 `mistral` 这样的仅提供商插件）。
- **hybrid-capability**：注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
- **hook-only**：只注册钩子（类型化钩子或自定义钩子），不注册能力、工具、命令或服务。
- **non-capability**：注册工具、命令、服务或路由，但不注册任何能力。

使用 `openclaw plugins inspect <id>` 可以查看插件的形态和能力拆分。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### Legacy 钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容性路径受到支持。现实中的 legacy 插件仍然依赖它。

方向如下：

- 保持其可用
- 在文档中将其标记为 legacy
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降且 fixture 覆盖证明迁移安全之后才移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 配置解析正常，且插件解析成功 |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`） |
| **legacy warning** | 插件使用了已弃用的 `before_agent_start` |
| **hard error** | 配置无效，或插件加载失败 |

目前，`hook-only` 和 `before_agent_start` 都不会导致你的插件失效：`hook-only` 只是提示性信息，而 `before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **Manifest + 设备发现**
   OpenClaw 会从已配置路径、工作区根目录、全局插件根目录和内置插件中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` manifest，以及受支持的 bundle manifest。
2. **启用 + 验证**
   核心决定一个已发现的插件是启用、禁用、阻止，还是被选中用于某个独占槽位（例如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundle 会被标准化为注册表记录，而无需导入运行时代码。
4. **表面消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现特别分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持延迟加载，并在首次调用时注册

这样既能让插件自有的 CLI 代码留在插件内部，同时也能让 OpenClaw 在解析之前预留根命令名称。

重要的设计边界是：

- 设备发现 + 配置验证应当依赖**manifest / schema 元数据**完成，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分让 OpenClaw 能在完整运行时激活之前，就验证配置、解释缺失 / 已禁用的插件，并构建 UI / schema 提示。

### 渠道插件与共享 message 工具

对于常规聊天操作，渠道插件不需要单独注册发送 / 编辑 / 反应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，而渠道插件拥有其背后的渠道特定发现与执行逻辑。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话 / 线程记录以及执行分发
- 渠道插件拥有作用域化动作发现、能力发现以及任何渠道特定的 schema 片段
- 渠道插件拥有提供商特定的会话对话语法，例如会话 ID 如何编码线程 ID 或如何从父对话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回可见动作、能力和 schema 贡献，从而避免这些部分彼此漂移。

当某个渠道特定的消息工具参数携带媒体来源（例如本地路径或远程媒体 URL）时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心会使用这个显式列表来应用沙箱路径标准化和出站媒体访问提示，而无需对插件自有参数名进行硬编码。
这里应优先使用按动作划分的映射，而不是一个渠道范围的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 等无关动作上被标准化。

核心会将运行时作用域传入这一步发现。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感的插件很重要。渠道可以根据当前账户、当前房间 / 线程 / 消息，或受信任的请求方身份来隐藏或暴露消息动作，而不必在核心 `message` 工具中硬编码渠道特定分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，以便共享的 `message` 工具为当前轮次暴露正确的渠道自有表面。

对于渠道自有的执行辅助工具，内置插件应将执行运行时保留在各自的 extension 模块内部。核心不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其 extension 自有模块导入本地运行时代码。

同样的边界也适用于一般情况下以提供商命名的 SDK 接缝：核心不应导入针对 Slack、Discord、Signal、WhatsApp 或类似 extension 的渠道特定便捷 barrel。如果核心需要某种行为，要么消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个范围明确的通用能力。

对于投票，当前有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道特定投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该动作之后，才延迟执行共享投票解析，因此插件自有的投票处理器可以接受渠道特定的投票字段，而不会先被通用投票解析器拦住。

完整启动顺序请参见 [加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为一个**公司**或一个**功能**的归属边界，而不是各种无关集成的杂物袋。

这意味着：

- 一个公司插件通常应拥有该公司的所有面向 OpenClaw 的表面
- 一个功能插件通常应拥有它引入的完整功能表面
- 渠道应消费共享核心能力，而不是临时重新实现提供商行为

<Accordion title="内置插件中的归属模式示例">
  - **供应商多能力**：`openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  - **供应商单能力**：`elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  - **功能插件**：`voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但它会消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件。
</Accordion>

预期的最终状态是：

- OpenAI 即使同时覆盖文本模型、语音、图像以及未来的视频，也仍然存在于同一个插件中
- 其他供应商也可以对自己的能力范围采用相同方式
- 渠道并不关心由哪个供应商插件拥有该提供商；它们消费的是核心暴露的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 多个插件可以实现或消费的核心契约

因此，如果 OpenClaw 新增一个领域，例如视频，第一个问题不是“哪个提供商应该硬编码处理视频？”。第一个问题应当是“核心的视频能力契约是什么？”一旦这个契约存在，供应商插件就可以针对它进行注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 以类型化方式通过插件 API / 运行时将其暴露出来
3. 让渠道 / 功能围绕该能力完成接线
4. 让供应商插件注册实现

这样既能保持归属关系明确，也能避免核心行为依赖某个单一供应商或某条一次性的插件特定代码路径。

### 能力分层

在决定代码应放在哪里时，请使用以下思维模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **供应商插件层**：供应商特定 API、认证、模型目录、语音合成、图像生成、未来的视频后端、使用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费核心能力并将其呈现在某个表面上

例如，TTS 遵循如下形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先采用同样的模式。

### 多能力公司插件示例

从外部看，一个公司插件应当是内聚的。如果 OpenClaw 对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索都有共享契约，那么某个供应商就可以在一个地方拥有它的所有表面：

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

重要的不是辅助函数的确切名称，而是这种形态：

- 一个插件拥有该供应商的表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。这里同样适用相同的归属模型：

1. 核心定义媒体理解契约
2. 供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`
3. 渠道和功能插件消费共享的核心行为，而不是直接接线到供应商代码

这样可以避免把某个提供商关于视频的假设固化进核心。插件拥有供应商表面；核心拥有能力契约和回退行为。

视频生成已经采用了同样的顺序：核心拥有类型化的能力契约和运行时辅助工具，而供应商插件则针对它注册 `api.registerVideoGenerationProvider(...)` 实现。

需要一个具体的发布检查清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面被有意设计为类型化，并集中在
`OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可以依赖的运行时辅助工具。

这之所以重要，是因为：

- 插件作者可以获得一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册同一个提供商 ID
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件归属，并防止静默漂移

这里有两层强制执行：

1. **运行时注册强制执行**
   插件在加载时，插件注册表会验证各项注册。例如：重复的提供商 ID、重复的语音提供商 ID，以及格式错误的注册，都会产生插件诊断，而不是导致未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 明确断言归属关系。当前这用于模型提供商、语音提供商、Web 搜索提供商以及内置注册归属。

实际效果是，OpenClaw 从一开始就知道哪个插件拥有哪个表面。这样核心和渠道就能无缝组合，因为归属关系是声明式、类型化并且可测试的，而不是隐式的。

### 什么内容应该属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力特定的
- 由核心拥有
- 可被多个插件复用
- 能被渠道 / 功能在不了解供应商细节的情况下消费

糟糕的插件契约则是：

- 隐藏在核心中的供应商特定策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接深入供应商实现
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如有疑问，就提高抽象层级：先定义能力，再让插件接入其中。

## 执行模型

原生 OpenClaw 插件会与 Gateway 网关 **在同一进程内**运行。它们**不**处于沙箱隔离中。已加载的原生插件与核心代码具有相同的进程级信任边界。

其影响包括：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 Gateway 网关崩溃或变得不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置 Skills。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。应将工作区插件视为开发期代码，而不是生产默认项。

对于内置工作区包名，应将插件 ID 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄的插件角色时，使用经批准的类型化后缀，例如
`-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是**插件 ID**，而不是来源出处。
- 当启用 / 加入 allowlist 的工作区插件与某个内置插件拥有相同 ID 时，它会有意遮蔽该内置副本。
- 这很正常，也对本地开发、补丁测试和热修复很有用。
- 内置插件的信任是根据源码快照解析的——也就是加载时磁盘上的 manifest 和代码——而不是安装元数据。损坏或被替换的安装记录，无法在实际源码声明之外静默扩大某个内置插件的信任表面。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷接口。

请保持能力注册公开，同时裁剪非契约辅助导出：

- 内置插件特定的辅助子路径
- 不打算作为公开 API 的运行时 plumbing 子路径
- 供应商特定的便捷辅助工具
- 属于实现细节的 setup / onboarding 辅助工具

出于兼容性和内置插件维护需要，一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将它们视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和包元数据
3. 拒绝不安全的候选项
4. 标准化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 决定每个候选项的启用状态
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 jiti
7. 调用原生 `register(api)` 钩子，并将注册收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的 legacy 别名——加载器会解析当前存在的那个（`def.register ?? def.activate`），并在同一时机调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会在运行时代码执行**之前**生效。如果入口逃逸出插件根目录、路径对所有人可写，或对于非内置插件而言路径归属看起来可疑，那么这些候选项就会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / 目录元数据
- 在不加载插件运行时的情况下保留轻量的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍属于控制平面。它们只是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批真实激活消费者现在会使用 manifest 中的命令、渠道和提供商提示，在更广泛的注册表实体化之前先缩小插件加载范围：

- CLI 加载会收窄到拥有所请求主命令的插件
- 渠道设置 / 插件解析会收窄到拥有所请求渠道 ID 的插件
- 显式提供商设置 / 运行时解析会收窄到拥有所请求提供商 ID 的插件

设置发现现在会优先使用描述符自有的 ID，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先收窄候选插件；`setup-api` 仅用于那些仍需要设置时运行时钩子的插件。如果多个已发现插件声明了相同的标准化设置提供商或 CLI 后端 ID，那么设置查找会拒绝这个存在歧义的归属者，而不是依赖发现顺序。

### 加载器会缓存什么

OpenClaw 会保留一些短期进程内缓存，用于存放：

- 设备发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动成本和重复命令开销。可以安全地将它们视为短生命周期的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可以禁用这些缓存。
- 可通过 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改任意核心全局状态。它们会注册到一个中央插件注册表中。

该注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断）
- 工具
- legacy 钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

随后，核心功能会从这个注册表中读取，而不是直接与插件模块交互。这样可以让加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对于可维护性很重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定时作出响应。

使用 `api.onConversationBindingResolved(...)`，可在绑定请求被批准或拒绝后接收回调：

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

回调载荷字段包括：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求对应的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 ID 和会话元数据

此回调仅用于通知。它不会改变谁被允许绑定会话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件有三层：

- **Manifest 元数据**，用于低成本的运行前查找：`providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（legacy `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，覆盖认证、模型解析、
  流包装、思考级别、重放策略和使用量端点。完整列表见
  [钩子顺序与用法](#hook-order-and-usage)。

OpenClaw 仍然拥有通用智能体循环、故障转移、转录处理和工具策略。这些钩子是面向提供商特定行为的扩展表面，而无需整套自定义推理传输。

当提供商具有基于环境变量的凭证，并且希望通用认证 / 状态 / 模型选择路径在不加载插件运行时的情况下也能感知时，请使用 manifest `providerAuthEnvVars`。当一个提供商 ID 需要复用另一个提供商 ID 的环境变量、认证配置文件、基于配置的认证以及 API 密钥新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导 / 认证选择 CLI 表面需要在不加载提供商运行时的情况下，知道该提供商的 choice ID、分组标签以及简单的单标志认证接线时，请使用 manifest `providerAuthChoices`。对于面向运维人员的提示（例如新手引导标签或 OAuth client-id / client-secret 设置变量），请将提供商运行时 `envVars` 保留用于此类用途。

当某个渠道具有由环境变量驱动的认证或设置，并且希望通用 shell 环境变量回退、配置 / 状态检查或设置提示在不加载渠道运行时的情况下也能感知时，请使用 manifest `channelEnvVars`。

### 钩子顺序与用法

对于模型 / 提供商插件，OpenClaw 会大致按如下顺序调用钩子。
“何时使用”这一列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog` | 在生成 `models.json` 时将提供商配置发布到 `models.providers` 中 | 提供商拥有目录或 base URL 默认值 |
| 2   | `applyConfigDefaults` | 在配置实体化期间应用提供商自有的全局配置默认值 | 默认值依赖于认证模式、环境变量或提供商模型家族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试正常的注册表 / 目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId` | 在查找前标准化 legacy 或预览版模型 ID 别名 | 提供商在规范模型解析之前拥有别名清理逻辑 |
| 4   | `normalizeTransport` | 在通用模型组装之前标准化提供商家族的 `api` / `baseUrl` | 提供商在同一传输家族中拥有用于自定义提供商 ID 的传输清理逻辑 |
| 5   | `normalizeConfig` | 在运行时 / 提供商解析之前标准化 `models.providers.<id>` | 提供商需要应与插件放在一起的配置清理逻辑；内置的 Google 家族辅助工具也会为受支持的 Google 配置条目提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 将原生流式使用量兼容性重写应用到配置提供商上 | 提供商需要基于端点的原生流式使用量元数据修复 |
| 7   | `resolveConfigApiKey` | 在加载运行时认证之前，为配置提供商解析环境变量标记式认证 | 提供商拥有环境变量标记式 API 密钥解析逻辑；`amazon-bedrock` 也在此内置了 AWS 环境变量标记解析器 |
| 8   | `resolveSyntheticAuth` | 在不持久化明文的情况下暴露本地 / 自托管或基于配置的认证 | 提供商可使用合成 / 本地凭证标记运行 |
| 9   | `resolveExternalAuthProfiles` | 叠加提供商自有的外部认证配置文件；CLI / 应用自有凭证的默认 `persistence` 为 `runtime-only` | 提供商可复用外部认证凭证，而无需持久化复制后的刷新令牌；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符下调到环境变量 / 基于配置的认证之后 | 提供商存储了不应获得更高优先级的合成占位符配置文件 |
| 11  | `resolveDynamicModel` | 为本地注册表中尚不存在的提供商自有模型 ID 提供同步回退 | 提供商接受任意上游模型 ID |
| 12  | `prepareDynamicModel` | 异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 ID 之前需要网络元数据 |
| 13  | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型之前做最终重写 | 提供商需要传输重写，但仍使用核心传输 |
| 14  | `contributeResolvedModelCompat` | 为位于另一个兼容传输之后的供应商模型提供兼容性标志 | 提供商能在代理传输上识别自己的模型，而无需接管该提供商 |
| 15  | `capabilities` | 由共享核心逻辑使用的提供商自有转录 / 工具元数据 | 提供商需要转录 / 提供商家族特定的特殊处理 |
| 16  | `normalizeToolSchemas` | 在嵌入式 runner 看到工具 schema 之前对其进行标准化 | 提供商需要传输家族级别的 schema 清理 |
| 17  | `inspectToolSchemas` | 在标准化之后暴露提供商自有的 schema 诊断信息 | 提供商希望输出关键字警告，而不需要让核心了解提供商特定规则 |
| 18  | `resolveReasoningOutputMode` | 选择原生还是带标签的推理输出契约 | 提供商需要使用带标签的推理 / 最终输出，而不是原生字段 |
| 19  | `prepareExtraParams` | 在通用流选项包装器之前执行请求参数标准化 | 提供商需要默认请求参数或按提供商划分的参数清理 |
| 20  | `createStreamFn` | 用自定义传输完全替换正常的流路径 | 提供商需要自定义线协议，而不仅仅是一个包装器 |
| 21  | `wrapStreamFn` | 在应用通用包装器之后再对流函数进行包装 | 提供商需要请求头 / 请求体 / 模型兼容性包装器，而无需自定义传输 |
| 22  | `resolveTransportTurnState` | 附加原生的逐轮传输请求头或元数据 | 提供商希望通用传输发送提供商原生的轮次身份 |
| 23  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 请求头或会话冷却策略 | 提供商希望通用 WS 传输调整会话请求头或回退策略 |
| 24  | `formatApiKey` | 认证配置文件格式化器：已存储配置文件会变成运行时 `apiKey` 字符串 | 提供商存储了额外认证元数据，并需要自定义运行时令牌形态 |
| 25  | `refreshOAuth` | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | 提供商不适配共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint` | 当 OAuth 刷新失败时附加修复提示 | 提供商在刷新失败后需要提供商自有的认证修复指引 |
| 27  | `matchesContextOverflowError` | 提供商自有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法识别的原始溢出错误 |
| 28  | `classifyFailoverReason` | 提供商自有的故障转移原因分类 | 提供商可以将原始 API / 传输错误映射为限流 / 过载 / 等 |
| 29  | `isCacheTtlEligible` | 面向代理 / 回传提供商的提示词缓存策略 | 提供商需要代理特定的缓存 TTL 门控 |
| 30  | `buildMissingAuthMessage` | 替换通用的缺失认证恢复消息 | 提供商需要提供商特定的缺失认证恢复提示 |
| 31  | `suppressBuiltInModel` | 过时上游模型抑制，并可选提供面向用户的错误提示 | 提供商需要隐藏过时的上游条目，或用供应商提示替换它们 |
| 32  | `augmentModelCatalog` | 在设备发现后追加合成 / 最终目录条目 | 提供商需要在 `models list` 和选择器中加入面向前向兼容的合成条目 |
| 33  | `resolveThinkingProfile` | 设置特定模型的 `/think` 级别、显示标签和默认值 | 提供商为选定模型提供自定义思考层级或二元标签 |
| 34  | `isBinaryThinking` | 开 / 关推理切换兼容性钩子 | 提供商只暴露二元的思考开 / 关 |
| 35  | `supportsXHighThinking` | `xhigh` 推理支持兼容性钩子 | 提供商希望只在部分模型上启用 `xhigh` |
| 36  | `resolveDefaultThinkingLevel` | 默认 `/think` 级别兼容性钩子 | 提供商拥有某个模型家族的默认 `/think` 策略 |
| 37  | `isModernModelRef` | 用于实时配置文件筛选和 smoke 选择的现代模型匹配器 | 提供商拥有实时 / smoke 首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时令牌 / 密钥 | 提供商需要令牌交换或短生命周期请求凭证 |
| 39  | `resolveUsageAuth` | 为 `/usage` 及相关状态表面解析使用量 / 计费凭证 | 提供商需要自定义使用量 / 配额令牌解析，或使用不同的使用量凭证 |
| 40  | `fetchUsageSnapshot` | 在认证解析完成后获取并标准化提供商特定的使用量 / 配额快照 | 提供商需要提供商特定的使用量端点或载荷解析器 |
| 41  | `createEmbeddingProvider` | 为 memory / 搜索构建提供商自有的 embedding 适配器 | Memory embedding 行为应归属于提供商插件 |
| 42  | `buildReplayPolicy` | 返回一个控制该提供商转录处理方式的重放策略 | 提供商需要自定义转录策略（例如去除思考块） |
| 43  | `sanitizeReplayHistory` | 在通用转录清理之后重写重放历史 | 提供商需要超出共享压缩辅助工具范围的提供商特定重放重写 |
| 44  | `validateReplayTurns` | 在嵌入式 runner 之前对重放轮次进行最终验证或重塑 | 提供商传输在通用净化之后需要更严格的轮次验证 |
| 45  | `onModelSelected` | 在模型被选中后运行提供商自有的副作用 | 当某个模型变为活动状态时，提供商需要遥测或提供商自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后继续回退到其他具备钩子能力的提供商插件，直到确实有某个插件修改了模型 ID 或传输 / 配置为止。这样可以让别名 / 兼容提供商 shim 正常工作，而无需调用方知道是哪个内置插件拥有该重写逻辑。如果没有任何提供商钩子去重写某个受支持的 Google 家族配置条目，那么内置的 Google 配置标准化器仍会应用该兼容性清理。

如果某个提供商需要完全自定义的线协议或自定义请求执行器，那就属于另一类扩展了。这些钩子适用于仍运行在 OpenClaw 正常推理循环上的提供商行为。

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

内置提供商插件会组合使用上述钩子，以满足各个供应商在目录、认证、思考、重放和使用量方面的需求。权威的钩子集合以每个插件在 `extensions/` 下的实现为准；本页展示的是形态，而不是逐项镜像该列表。

<AccordionGroup>
  <Accordion title="直通式目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，这样它们就可以在 OpenClaw 的静态目录之前暴露上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 和使用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 搭配使用，以拥有令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放与转录清理家族">
    共享的命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）让提供商能够通过
    `buildReplayPolicy` 选择加入转录策略，而不是由每个插件各自重复实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 以及
    `volcengine` 只注册 `catalog`，并运行在共享推理循环之上。
  </Accordion>
  <Accordion title="Anthropic 特定流辅助工具">
    Beta 请求头、`/fast` / `serviceTier` 以及 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是放在通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分核心辅助工具。对于 TTS：

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

- `textToSpeech` 返回适用于文件 / 语音消息表面的常规核心 TTS 输出载荷。
- 使用核心 `messages.tts` 配置和提供商选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须针对具体提供商完成重采样 / 编码。
- `listVoices` 对每个提供商来说是可选的。可将其用于供应商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如地区、性别和个性标签，以供感知提供商差异的选择器使用。
- 目前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

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
- 使用语音提供商承载供应商自有的合成行为。
- legacy Microsoft `edge` 输入会被标准化为 `microsoft` 提供商 ID。
- 首选的归属模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个供应商插件可以同时拥有文本、语音、图像以及未来的媒体提供商。

对于图像 / 音频 / 视频理解，插件应注册一个类型化的媒体理解提供商，而不是使用通用的键 / 值包：

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
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已经遵循同样的模式：
  - 核心拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
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

对于音频转录，插件可以使用媒体理解运行时，或使用较旧的 STT 别名：

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
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时（例如输入被跳过 / 不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍然保留作为兼容性别名。

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
- OpenClaw 只会为受信任调用方应用这些覆盖字段。
- 对于插件自有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定的规范 `provider/model` 目标，或设置为 `"*"` 以显式允许任意目标。
- 不受信任的插件子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是深入使用智能体工具接线：

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
`api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商承载供应商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能 / 渠道插件的首选共享表面，它们可借此获得搜索行为，而无需依赖智能体工具包装器。

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
- `auth`：必填。使用 `"gateway"` 表示要求常规 Gateway 网关认证，或使用 `"plugin"` 表示插件管理的认证 / webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换其自身已有的路由注册。
- `handler`：当该路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 如果 `path + match` 完全冲突，则除非设置 `replaceExisting: true`，否则会被拒绝；并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅可在相同认证级别内保持 `exact` / `prefix` 级联链路。
- `auth: "plugin"` 路由**不会**自动接收运维人员运行时作用域。它们用于插件管理的 webhook / 签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内执行，但该作用域被有意设计得较为保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口下的 `gateway.auth.mode = "none"`）只有在显式存在该请求头时，才会遵循 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，则运行时作用域会回退为 `operator.write`
- 实用规则：不要假设一个带 Gateway 网关认证的插件路由天然就是管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用带身份的认证模式，并在文档中说明显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用窄范围的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径包括：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core` | 渠道入口 / 构建辅助工具 |
| `openclaw/plugin-sdk/core` | 通用共享辅助工具和总括契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件可从一组窄范围接缝中选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应统一收敛到单一的 `approvalCapability` 契约，而不是混杂在不相关的插件字段中。详见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它只是为旧插件提供的兼容性 shim。新代码应改为导入更窄范围的通用原语。
</Info>

仓库内部入口点（针对每个内置插件包根目录）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助工具 / 类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— setup 插件入口

外部插件只应导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或其他插件中导入另一个插件包的 `src/*`。
由 facade 加载的入口点会在存在时优先使用当前活动的运行时配置快照，否则回退到磁盘上的已解析配置文件。

诸如 `image-generation`、`media-understanding` 和 `speech` 之类的能力特定子路径之所以存在，是因为当前内置插件正在使用它们。但它们并不自动意味着是长期冻结的外部契约——在依赖它们之前，请查阅相应的 SDK 参考页面。

## message 工具 schema

对于反应、已读和投票等非消息原语，插件应拥有渠道特定的 `describeMessageTool(...)` schema 贡献。
共享发送呈现应使用通用的 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、区块或卡片字段。
有关契约、回退规则、提供商映射以及插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明其可渲染内容：

- `presentation` 用于语义化展示区块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于置顶交付请求

核心决定是原生渲染该展示，还是将其降级为文本。不要从通用 message 工具暴露提供商原生 UI 的逃生口。
针对 legacy 原生 schema 的已弃用 SDK 辅助工具仍会为现有第三方插件继续导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。请保持共享出站宿主的通用性，并使用消息适配器表面承载提供商规则：

- `messaging.inferTargetChatType({ to })` 决定一个标准化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应跳过目录搜索，直接进入类似 ID 的解析
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，当核心在标准化之后或目录未命中之后需要最终的提供商自有解析时使用
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后拥有提供商特定的会话路由构建逻辑

推荐拆分方式：

- 对于应在搜索 peer / group 之前发生的类别判断，使用 `inferTargetChatType`
- 对于“将其视为显式 / 原生目标 ID”的检查，使用 `looksLikeId`
- 对于提供商特定的标准化回退，使用 `resolveTarget`，而不要让它承担广义目录搜索
- 将 chat ID、thread ID、JID、handle 和 room ID 之类的提供商原生 ID 保留在 `target` 值或提供商特定参数中，而不是放进通用 SDK 字段里

## 基于配置的目录

如果插件需要从配置中派生目录条目，应将这部分逻辑保留在插件内部，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

适用场景包括某个渠道需要基于配置的 peer / group，例如：

- 由 allowlist 驱动的私信 peer
- 已配置的渠道 / 群组映射
- 账户范围的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- limit 应用
- 去重 / 标准化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 ID 标准化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })`
为推理定义模型目录。

`catalog.run(...)` 返回的形态与 OpenClaw 写入
`models.providers` 的内容一致：

- `{ provider }` 表示一个提供商条目
- `{ providers }` 表示多个提供商条目

当插件拥有提供商特定的模型 ID、base URL 默认值或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：纯 API 密钥或环境变量驱动的提供商
- `profile`：当存在认证配置文件时出现的提供商
- `paired`：会合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后出现的提供商会在键冲突时获胜，因此插件可以有意用同一个提供商 ID 覆盖某个内置提供商条目。

兼容性：

- `discovery` 仍然可作为 legacy 别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，除了实现 `resolveAccount(...)` 之外，也请优先实现
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已被完整实体化，并且在缺少必需 secret 时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 doctor / 配置修复流程，不应为了描述配置而必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关情况下包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足够支持状态类命令。
- 当某个凭证通过 SecretRef 配置、但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样可以让只读命令报告“已配置，但在此命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## Package pack

插件目录可以包含一个带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果该 pack 列出了多个 extension，则插件 ID 会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接之后都必须仍位于插件目录内部。任何逃逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖
（无生命周期脚本，运行时也不安装开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免依赖需要 `postinstall` 构建的包。

可选项：`openclaw.setupEntry` 可以指向一个轻量级、仅用于 setup 的模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面时，或者当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样在你的主插件入口还同时接线了工具、钩子或其他仅运行时代码时，可以让启动和设置过程更轻量。

可选项：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关监听前的启动阶段，即使渠道已经配置完成，也走相同的 `setupEntry` 路径。

仅当 `setupEntry` 已完整覆盖在 Gateway 网关开始监听之前必须存在的启动表面时，才应使用此选项。实际而言，这意味着 setup 入口必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听之前就可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果完整入口仍拥有任何必需的启动能力，就不要启用此标志。请保持插件采用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅用于 setup 的契约表面辅助工具，供核心在完整渠道运行时加载之前查询。当前的 setup 提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将 legacy 单账户渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用这一表面。Matrix 是当前的内置示例：当命名账户已存在时，它只会将认证 / 引导键移动到一个已命名的提升账户中，并且可以保留一个已配置的非规范默认账户键，而不是总是创建 `accounts.default`。

这些 setup 补丁适配器让内置契约表面发现保持懒加载。导入时间保持轻量；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请保持它们使用插件特定前缀。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终会解析为 `operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 声明 setup / 发现元数据，并通过 `openclaw.install` 声明安装提示。这样可以让核心目录保持无数据。

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
      "blurb": "通过 Nextcloud Talk webhook 机器人实现自托管聊天。",
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

- `detailLabel`：用于更丰富目录 / 状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于其之上的较低优先级插件 / 渠道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制项
- `markdownCapable`：将该渠道标记为支持 Markdown，以供出站格式决策使用
- `exposure.configured`：设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部 / 私有，用于文档导航表面
- `showConfigured` / `showInSetup`：出于兼容性仍接受的 legacy 别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如一个 MPM
注册表导出）。只需将一个 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号 / 分号 / `PATH` 分隔）。每个文件应包含
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的 legacy 别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，包括摄取、组装和压缩。可在你的插件中通过
`api.registerContextEngine(id, factory)` 进行注册，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是添加 memory 搜索或钩子时，请使用此机制。

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

如果你的引擎**不**拥有压缩算法，请仍然实现 `compact()`，并显式委托出去：

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

当插件需要的行为不适配当前 API 时，不要通过私有深度接入绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义核心契约  
   明确核心应拥有哪些共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册 / 运行时表面  
   以最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线核心 + 渠道 / 功能消费者  
   渠道和功能插件应通过核心消费这个新能力，而不是直接导入某个供应商实现。
4. 注册供应商实现  
   然后由供应商插件针对该能力注册各自的后端。
5. 添加契约覆盖  
   添加测试，使归属关系和注册形态随着时间推移仍保持明确。

这就是 OpenClaw 如何在保持明确立场的同时，不会被硬编码到某个供应商的世界观中。有关具体文件清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，`src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中的运维人员 / 插件文档

如果其中某个表面缺失，通常说明该能力还没有被完整集成。

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
- 供应商插件拥有供应商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试让归属关系保持明确
