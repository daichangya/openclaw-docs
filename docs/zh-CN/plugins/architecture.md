---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 了解插件能力模型或归属边界
    - 处理插件加载管线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载管线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-23T22:59:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbb9edc7e7cc7327ebbfb48d812cae1272ee8c1463c02a0b3a88342f52b42a7a
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。对于实用指南，请先从下面这些聚焦页面之一开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向最终用户的指南，用于添加、启用和排查插件问题。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    首个插件教程，包含最小可工作的 manifest。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件。
  </Card>
  <Card title="SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    import map 和注册 API 参考。
  </Card>
</CardGroup>

## 公共能力模型

Capabilities 是 OpenClaw 内部公共的**原生插件**模型。每个原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

| 能力                     | 注册方法                                         | 示例插件                             |
| ------------------------ | ------------------------------------------------ | ------------------------------------ |
| 文本推理                 | `api.registerProvider(...)`                      | `openai`、`anthropic`                |
| CLI 推理后端             | `api.registerCliBackend(...)`                    | `openai`、`anthropic`                |
| 语音                     | `api.registerSpeechProvider(...)`                | `elevenlabs`、`microsoft`            |
| 实时转写                 | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 实时语音                 | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒体理解                 | `api.registerMediaUnderstandingProvider(...)`    | `openai`、`google`                   |
| 图像生成                 | `api.registerImageGenerationProvider(...)`       | `openai`、`google`、`fal`、`minimax` |
| 音乐生成                 | `api.registerMusicGenerationProvider(...)`       | `google`、`minimax`                  |
| 视频生成                 | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web 抓取                 | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 搜索                 | `api.registerWebSearchProvider(...)`             | `google`                             |
| 渠道 / 消息              | `api.registerChannel(...)`                       | `msteams`、`matrix`                  |

一个插件如果注册了零个能力，但提供了 hooks、工具或服务，则它是一个**旧版仅 hook** 插件。该模式目前仍然被完整支持。

### 对外兼容性立场

能力模型已经在 core 中落地，并已被当前的内置 / 原生插件使用，但对外部插件的兼容性，仍需要比“它已导出，因此它被冻结了”更严格的标准。

| 插件情况                                         | 指导意见                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 现有外部插件                                     | 保持基于 hook 的集成继续可用；这是兼容性的基线。                                                 |
| 新的内置 / 原生插件                              | 优先采用显式能力注册，而不是面向供应商的特定深度接入或新的仅 hook 设计。                         |
| 采用能力注册的外部插件                           | 允许，但除非文档明确标记为稳定，否则应将能力专属的辅助接口视为持续演进中。                       |

能力注册是预期方向。旧版 hooks 在过渡期间仍然是对外部插件最安全、最不易破坏的路径。导出的辅助子路径并不都同等稳定——应优先使用范围窄、已文档化的契约，而不是偶然导出的辅助接口。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为，而不仅仅是静态元数据，将其分类为一种形态：

- **plain-capability**：恰好注册一种能力类型（例如仅提供 provider 的插件 `mistral`）。
- **hybrid-capability**：注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
- **hook-only**：只注册 hooks（类型化或自定义），不注册任何能力、工具、命令或服务。
- **non-capability**：注册工具、命令、服务或路由，但不注册能力。

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力拆分。详情请参见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧版 hooks

`before_agent_start` hook 仍然作为兼容性路径支持，仅 hook 插件仍可使用。现实中的旧版插件仍然依赖它。

方向：

- 保持其可用
- 将其文档化为旧版能力
- 对于模型 / 提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实用量下降，并且 fixture 覆盖证明迁移安全后，才移除它

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签之一：

| 信号                       | 含义                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 配置解析正常，且插件可成功解析                               |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`）             |
| **legacy warning**         | 插件使用了 `before_agent_start`，该能力已弃用                |
| **hard error**             | 配置无效，或插件加载失败                                     |

今天，`hook-only` 和 `before_agent_start` 都不会导致你的插件失效：`hook-only` 只是提示，`before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **Manifest + 发现**
   OpenClaw 会从已配置路径、工作区根目录、全局插件根目录和内置插件中查找候选插件。发现阶段会优先读取原生 `openclaw.plugin.json` manifests，以及受支持的 bundle manifests。
2. **启用 + 验证**
   core 会决定已发现插件是启用、禁用、屏蔽，还是被选入某个排他槽位，例如 memory。
3. **运行时加载**
   原生 OpenClaw 插件会通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的 bundles 会被规范化为注册表记录，而无需导入运行时代码。
4. **界面消费**
   OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、hooks、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现专门拆分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持惰性，并在首次调用时再注册

这样既能让插件拥有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析之前预留根命令名称。

重要的设计边界：

- 发现 + 配置验证应基于 **manifest / schema 元数据** 完成，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 可以在完整运行时尚未激活前，先验证配置、解释缺失 / 已禁用的插件，以及构建 UI / schema 提示。

### 渠道插件与共享消息工具

对于普通聊天动作，渠道插件无需单独注册发送 / 编辑 / 反应工具。OpenClaw 在 core 中保留一个共享的 `message` 工具，而渠道插件负责其背后的渠道专属发现和执行。

当前边界如下：

- core 拥有共享 `message` 工具宿主、提示词接线、会话 / 线程簿记以及执行分发
- 渠道插件拥有作用域内动作发现、能力发现以及任何渠道专属 schema 片段
- 渠道插件拥有提供商专属的会话对话语法，例如对话 id 如何编码线程 id 或从父对话继承
- 渠道插件通过其动作适配器执行最终动作

对于渠道插件，SDK 界面是
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用允许插件将其可见动作、能力以及 schema 贡献一起返回，从而避免这些部分彼此漂移。

当某个渠道专属的消息工具参数携带媒体源，例如本地路径或远程媒体 URL 时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。core 会使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而不是硬编码插件拥有的参数名。
这里应优先使用按动作划分的映射，而不是某个渠道级的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 等无关动作上被规范化。

core 会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 可信的入站 `requesterSenderId`

这对于上下文敏感的插件非常重要。渠道可以根据当前活跃账户、当前房间 / 线程 / 消息或可信请求者身份，隐藏或暴露消息动作，而无需在 core 的 `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式 runner 路由变更仍属于插件工作：runner 负责将当前聊天 / 会话身份转发到插件发现边界，以便共享 `message` 工具在当前轮次暴露正确的、由渠道拥有的界面。

对于由渠道拥有的执行辅助运行时，内置插件应将执行运行时保留在各自的 extension 模块内。core 不再在 `src/agents/tools` 下拥有 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从各自 extension 拥有的模块导入本地运行时代码。

同样的边界也适用于一般性的、以提供商命名的 SDK 接缝：core 不应导入 Slack、Discord、Signal、WhatsApp 或类似 extension 的渠道专属便捷 barrel。如果 core 需要某种行为，应当消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，或者将该需求提升为共享 SDK 中的狭义通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道专属投票语义或附加投票参数的首选路径

现在，core 会在插件投票分发拒绝该动作之后，才延迟执行共享投票解析，因此由插件拥有的投票处理器可以接受渠道专属投票字段，而不会先被通用投票解析器阻塞。

完整启动顺序请参见 [加载管线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，而不是一堆互不相关集成的集合。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外界面
- 功能插件通常应拥有其引入的完整功能界面
- 渠道应消费共享 core 能力，而不是临时重新实现提供商行为

<Accordion title="内置插件中的归属模式示例">
  - **供应商多能力**：`openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  - **供应商单能力**：`elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  - **功能插件**：`voice-call` 拥有呼叫传输、工具、CLI、路由和 Twilio 媒体流桥接，但它消费共享的语音、实时转写和实时语音能力，而不是直接导入供应商插件。
</Accordion>

预期的最终状态是：

- OpenAI 即使同时涵盖文本模型、语音、图像和未来的视频，也仍然只存在于一个插件中
- 其他供应商也可以用同样方式管理其自己的界面范围
- 渠道并不关心哪个供应商插件拥有该 provider；它们只消费 core 暴露的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的 core 契约

因此，如果 OpenClaw 新增了某个新领域，例如视频，首要问题并不是
“哪个 provider 应该硬编码视频处理？” 首要问题是 “core 的视频能力契约是什么？”
一旦该契约存在，供应商插件就可以针对它进行注册，而渠道 / 功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在 core 中定义缺失的能力
2. 通过插件 API / 运行时以类型化方式暴露它
3. 将渠道 / 功能与该能力接线
4. 让供应商插件注册实现

这样可以保持归属明确，同时避免让 core 行为依赖某个单一供应商或一次性的插件专属代码路径。

### 能力分层

在决定代码归属时，可使用以下思维模型：

- **core 能力层**：共享编排、策略、回退、配置合并规则、投递语义和类型化契约
- **供应商插件层**：供应商专属 API、认证、模型目录、语音合成、图像生成、未来的视频后端、用量端点
- **渠道 / 功能插件层**：Slack / Discord / voice-call / 等集成，它们消费 core 能力并在某个界面上呈现出来

例如，TTS 遵循以下形态：

- core 拥有回复时 TTS 策略、回退顺序、偏好和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来能力也应优先遵循相同模式。

### 多能力公司插件示例

一个公司插件从外部看应该具备一致性。如果 OpenClaw 为模型、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索提供共享契约，那么某个供应商就可以在一个地方拥有其全部界面：

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

关键不在于辅助函数的确切名称。重要的是这种形态：

- 一个插件拥有该供应商界面
- core 仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件确实注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像 / 音频 / 视频理解视为一种共享能力。相同的归属模型也适用于这里：

1. core 定义媒体理解契约
2. 供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和
   `describeVideo`
3. 渠道和功能插件消费共享 core 行为，而不是直接接到供应商代码

这样可以避免将某个 provider 的视频假设直接固化到 core 中。插件拥有供应商界面；core 拥有能力契约和回退行为。

视频生成已经采用了同样顺序：core 拥有类型化能力契约和运行时辅助工具，而供应商插件则针对它注册
`api.registerVideoGenerationProvider(...)` 实现。

需要具体的发布清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与约束执行

插件 API 界面有意采用类型化，并集中定义在
`OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这很重要，因为：

- 插件作者获得了统一且稳定的内部标准
- core 可以拒绝重复归属，例如两个插件注册相同的 provider id
- 启动时可以为格式错误的注册输出可操作的诊断信息
- 契约测试可以强制执行内置插件归属，并防止无声漂移

约束执行有两层：

1. **运行时注册约束执行**
   插件注册表会在插件加载时验证注册。例如：
   重复的 provider id、重复的语音 provider id，以及格式错误的
   注册，不会导致未定义行为，而是产生插件诊断信息。
2. **契约测试**
   内置插件会在测试运行期间被记录到契约注册表中，这样 OpenClaw
   就能显式断言归属。如今这用于模型 providers、语音 providers、Web 搜索 providers，以及内置注册归属。

实际效果是，OpenClaw 能预先知道哪个插件拥有哪个界面。由于归属是声明式、类型化且可测试的，core 和渠道因此能够无缝组合，而不是依赖隐式约定。

### 什么应该属于契约

好的插件契约应当是：

- 类型化的
- 小而精的
- 能力专属的
- 由 core 拥有
- 可被多个插件复用
- 可被渠道 / 功能消费，而无需了解供应商细节

不好的插件契约则包括：

- 隐藏在 core 中的供应商专属策略
- 绕过注册表的一次性插件逃生口
- 渠道代码直接深入供应商实现
- 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象

如有疑问，请提高抽象层级：先定义能力，再让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关 **在同一进程内** 运行。它们不在沙箱中。一个已加载的原生插件与 core 代码处于相同的进程级信任边界。

这意味着：

- 原生插件可以注册工具、网络处理器、hooks 和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码

兼容 bundles 默认更安全，因为 OpenClaw 当前将它们视为元数据 / 内容包。在当前版本中，这主要意味着内置的 skills。

对于非内置插件，请使用 allowlist 和显式安装 / 加载路径。应将工作区插件视为开发阶段代码，而不是生产默认值。

对于内置工作区 package 名称，请保持插件 id 锚定在 npm
名称中：默认使用 `@openclaw/<id>`，或在插件有意暴露更窄角色时，使用经批准的类型化后缀，例如
`-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

重要的信任说明：

- `plugins.allow` 信任的是 **plugin ids**，而不是源码来源。
- 如果某个工作区插件与内置插件具有相同 id，当该工作区插件被启用 / 加入 allowlist 时，它会有意覆盖内置副本。
- 这在本地开发、补丁测试和紧急修复中是正常且有用的。
- 内置插件的信任是根据源码快照来解析的——即加载时磁盘上的 manifest 和代码——而不是根据安装元数据。受损或被替换的安装记录无法在实际源码声明之外，悄悄扩大某个内置插件的信任范围。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便利接口。

应保持能力注册为公开能力。应收缩非契约辅助导出：

- 内置插件专属辅助子路径
- 不打算作为公开 API 的运行时管线子路径
- 供应商专属便捷辅助工具
- 属于实现细节的设置 / 新手引导辅助工具

一些内置插件辅助子路径仍保留在生成的 SDK 导出映射中，以兼容旧用法和支持内置插件维护。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`，以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载管线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifests 和 package 元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 jiti
7. 调用原生 `register(api)` hooks，并将注册收集到插件注册表中
8. 向命令 / 运行时界面暴露该注册表

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析两者中存在的那个（`def.register ?? def.activate`），并在相同阶段调用它。所有内置插件都使用 `register`；新插件应优先使用 `register`。
</Note>

安全门槛发生在**运行时代码执行之前**。如果入口逃逸出插件根目录、路径可被全体用户写入，或对于非内置插件来说路径归属可疑，则候选项会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 用它来：

- 标识插件
- 发现声明的渠道 / skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / 目录元数据
- 在不加载插件运行时的前提下，保留轻量的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如 hooks、工具、命令或 provider 流程。

可选的 manifest `activation` 和 `setup` 块仍属于控制平面。它们只是用于激活规划和设置发现的纯元数据描述符；并不替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活使用方现在会利用 manifest 中的命令、渠道和 provider 提示，在更广泛的注册表物化之前先缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置 / 插件解析会缩小到拥有所请求渠道 id 的插件
- 显式 provider 设置 / 运行时解析会缩小到拥有所请求 provider id 的插件

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和
`setup.cliBackends`，以便在回退到 `setup-api` 之前先缩小候选插件范围；`setup-api` 仅用于那些仍需要设置阶段运行时 hooks 的插件。如果多个已发现插件声明了相同的规范化设置 provider 或 CLI backend id，设置查找会拒绝这个有歧义的归属，而不是依赖发现顺序。

### 加载器会缓存什么

OpenClaw 会维护短生命周期的进程内缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发式启动成本和重复命令开销。应将它们视为短暂的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改 core 中任意的全局状态。它们会注册到中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断）
- 工具
- 旧版 hooks 和类型化 hooks
- 渠道
- providers
- Gateway 网关 RPC handlers
- HTTP 路由
- CLI registrars
- 后台服务
- 由插件拥有的命令

然后，core 功能会从该注册表中读取，而不是直接与插件模块交互。这样可以保持加载方向单向：

- plugin module -> registry registration
- core runtime -> registry consumption

这种分离对可维护性非常重要。它意味着大多数 core 界面只需要一个集成点：“读取注册表”，而不是“为每个插件模块写特殊处理”。

## 对话绑定回调

绑定对话的插件可以在批准结果落定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后接收回调：

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
- `binding`：已批准请求对应的解析后绑定
- `request`：原始请求摘要、detach 提示、sender id 和
  对话元数据

此回调仅用于通知。它不会改变谁有权绑定对话，并且会在 core 的批准处理完成后运行。

## provider 运行时 hooks

provider 插件有三层：

- **Manifest 元数据**，用于低成本的运行时前查找：`providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时 hooks**：`catalog`（旧称 `discovery`）以及
  `applyConfigDefaults`。
- **运行时 hooks**：40 多个可选 hooks，涵盖认证、模型解析、
  流包装、思考级别、重放策略和用量端点。完整列表请参见
  [Hook 顺序与用法](#hook-order-and-usage)。

OpenClaw 仍然拥有通用智能体循环、故障转移、转录处理和工具策略。这些 hooks 是 provider 专属行为的扩展界面，因此无需整套自定义推理传输也能扩展。

当某个 provider 使用基于环境变量的凭证，并且你希望通用认证 / 状态 / 模型选择器路径在不加载插件运行时的情况下也能看到它时，请使用 manifest `providerAuthEnvVars`。当某个 provider id 应复用另一个 provider id 的环境变量、auth 配置文件、配置支持的认证以及 API key 新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导 / 认证选择 CLI 界面需要在不加载 provider 运行时的情况下知道 provider 的 choice id、分组标签和简单的一键认证接线时，请使用 manifest `providerAuthChoices`。请将 provider 运行时的 `envVars` 保留给面向运维的提示，例如新手引导标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有基于环境变量驱动的认证或设置，并且你希望通用 shell 环境变量回退、配置 / 状态检查或设置提示在不加载渠道运行时的情况下看到它时，请使用 manifest `channelEnvVars`。

### Hook 顺序与用法

对于 model / provider 插件，OpenClaw 会大致按以下顺序调用 hooks。
“何时使用”列是快速决策指南。

| #   | Hook                              | 作用                                                                                                           | 何时使用                                                                                                                                      |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 时，将 provider 配置发布到 `models.providers` 中                                          | provider 拥有目录或 base URL 默认值                                                                                                           |
| 2   | `applyConfigDefaults`             | 在配置物化期间应用由 provider 拥有的全局配置默认值                                                            | 默认值依赖认证模式、环境变量或 provider 模型家族语义                                                                                          |
| --  | _(内置模型查找)_                  | OpenClaw 会先尝试常规的注册表 / 目录路径                                                                      | _(不是插件 hook)_                                                                                                                             |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版模型 id 别名                                                                        | provider 在规范模型解析前拥有别名清理逻辑                                                                                                     |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化 provider 家族的 `api` / `baseUrl`                                                      | provider 在同一传输家族中为自定义 provider id 拥有传输清理逻辑                                                                                |
| 5   | `normalizeConfig`                 | 在运行时 / provider 解析前规范化 `models.providers.<id>`                                                      | provider 需要将配置清理逻辑保留在插件中；内置的 Google 家族辅助工具也会为受支持的 Google 配置项提供兜底                                      |
| 6   | `applyNativeStreamingUsageCompat` | 对配置中的 providers 应用原生流式用量兼容性重写                                                               | provider 需要基于端点修复原生流式用量元数据                                                                                                   |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证前，为配置中的 providers 解析 env-marker 认证                                                 | provider 拥有基于 env-marker 的 API key 解析逻辑；`amazon-bedrock` 在这里也有内置的 AWS env-marker 解析器                                   |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下暴露本地 / 自托管或配置支持的认证                                                       | provider 可以通过合成 / 本地凭证标记运行                                                                                                      |
| 9   | `resolveExternalAuthProfiles`     | 叠加由 provider 拥有的外部 auth 配置文件；CLI / 应用拥有的凭证默认 `persistence` 为 `runtime-only`            | provider 在不持久化复制的 refresh token 的情况下复用外部 auth 凭证；需在 manifest 中声明 `contracts.externalAuthProviders`                  |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成 profile 占位符优先级降低到 env / 配置支持的认证之后                                            | provider 存储了不应赢得优先级的合成占位 profile                                                                                               |
| 11  | `resolveDynamicModel`             | 为尚未出现在本地注册表中的 provider 拥有模型 id 提供同步回退                                                  | provider 接受任意上游模型 id                                                                                                                  |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel`                                                             | provider 在解析未知 id 之前需要网络元数据                                                                                                     |
| 13  | `normalizeResolvedModel`          | 在嵌入式 runner 使用已解析模型之前进行最终重写                                                                 | provider 需要进行传输重写，但仍使用 core 传输                                                                                                 |
| 14  | `contributeResolvedModelCompat`   | 为位于另一兼容传输后的供应商模型贡献兼容标志                                                                   | provider 能在代理传输中识别自己的模型，而无需接管该 provider                                                                                  |
| 15  | `capabilities`                    | 由 provider 拥有、供共享 core 逻辑使用的转录 / 工具元数据                                                     | provider 需要转录 / provider 家族层面的特殊行为                                                                                               |
| 16  | `normalizeToolSchemas`            | 在嵌入式 runner 看到之前规范化工具 schema                                                                     | provider 需要进行传输家族层面的 schema 清理                                                                                                   |
| 17  | `inspectToolSchemas`              | 在规范化之后暴露由 provider 拥有的 schema 诊断                                                                 | provider 希望提供关键字警告，而无需让 core 学习 provider 专属规则                                                                             |
| 18  | `resolveReasoningOutputMode`      | 选择原生推理输出契约还是带标签的推理输出契约                                                                   | provider 需要使用带标签的推理 / 最终输出，而不是原生字段                                                                                      |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前进行请求参数规范化                                                                       | provider 需要默认请求参数或按 provider 的参数清理                                                                                             |
| 20  | `createStreamFn`                  | 使用自定义传输完全替换正常流路径                                                                               | provider 需要自定义线路协议，而不只是一个包装器                                                                                               |
| 21  | `wrapStreamFn`                    | 在通用包装器应用之后对流函数再做包装                                                                           | provider 需要请求头 / 请求体 / 模型兼容包装器，而无需自定义传输                                                                               |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输头或元数据                                                                                   | provider 希望通用传输发送 provider 原生的轮次身份                                                                                             |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket headers 或会话冷却策略                                                                      | provider 希望通用 WS 传输调整会话 headers 或回退策略                                                                                          |
| 24  | `formatApiKey`                    | auth 配置文件格式化器：将已存储 profile 转换为运行时 `apiKey` 字符串                                           | provider 存储了额外的 auth 元数据，并需要自定义运行时 token 形态                                                                              |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略提供 OAuth 刷新覆盖                                                              | provider 不适配共享的 `pi-ai` 刷新器                                                                                                          |
| 26  | `buildAuthDoctorHint`             | 在 OAuth 刷新失败时追加修复提示                                                                                | provider 需要在刷新失败后提供由 provider 拥有的认证修复指引                                                                                   |
| 27  | `matchesContextOverflowError`     | 由 provider 拥有的上下文窗口溢出匹配器                                                                         | provider 存在通用启发式无法识别的原始溢出错误                                                                                                 |
| 28  | `classifyFailoverReason`          | 由 provider 拥有的故障转移原因分类                                                                             | provider 能将原始 API / 传输错误映射为限流 / 过载等类型                                                                                       |
| 29  | `isCacheTtlEligible`              | 面向代理 / 回传 provider 的提示词缓存策略                                                                      | provider 需要按代理特性控制 cache TTL                                                                                                         |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失认证恢复消息                                                                                     | provider 需要 provider 专属的缺失认证恢复提示                                                                                                 |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，并可附带面向用户的错误提示                                                                   | provider 需要隐藏过时的上游记录，或用供应商提示替换它们                                                                                       |
| 32  | `augmentModelCatalog`             | 在发现后追加合成 / 最终目录记录                                                                                | provider 需要在 `models list` 和选择器中加入用于前向兼容的合成记录                                                                            |
| 33  | `resolveThinkingProfile`          | 为特定模型设置 `/think` 级别、显示标签和默认值                                                                 | provider 为选定模型暴露自定义思考阶梯或二元标签                                                                                               |
| 34  | `isBinaryThinking`                | 开 / 关推理切换兼容性 hook                                                                                     | provider 只暴露二元的思考开 / 关                                                                                                               |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性 hook                                                                                    | provider 希望仅在部分模型上启用 `xhigh`                                                                                                       |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性 hook                                                                                  | provider 为某个模型家族拥有默认 `/think` 策略                                                                                                 |
| 37  | `isModernModelRef`                | 用于实时 profile 过滤和 smoke 选择的现代模型匹配器                                                             | provider 拥有实时 / smoke 首选模型匹配逻辑                                                                                                    |
| 38  | `prepareRuntimeAuth`              | 在推理前将已配置的凭证交换为实际运行时 token / key                                                             | provider 需要 token 交换或短生命周期的请求凭证                                                                                                |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关状态界面解析用量 / 计费凭证                                                                  | provider 需要自定义用量 / 配额 token 解析，或使用不同的用量凭证                                                                               |
| 40  | `fetchUsageSnapshot`              | 在认证解析后获取并规范化 provider 专属的用量 / 配额快照                                                        | provider 需要 provider 专属的用量端点或负载解析器                                                                                             |
| 41  | `createEmbeddingProvider`         | 为 memory / search 构建由 provider 拥有的 embedding 适配器                                                     | memory embedding 行为应归属于 provider 插件                                                                                                   |
| 42  | `buildReplayPolicy`               | 返回一个重放策略，用于控制该 provider 的转录处理                                                               | provider 需要自定义转录策略（例如去除 thinking 块）                                                                                           |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理之后重写重放历史                                                                                 | provider 需要共享压缩辅助工具之外的 provider 专属重放重写逻辑                                                                                 |
| 44  | `validateReplayTurns`             | 在嵌入式 runner 执行前，对重放轮次进行最终验证或重塑                                                           | provider 传输在通用清理之后需要更严格的轮次验证                                                                                               |
| 45  | `onModelSelected`                 | 在模型变为活跃后运行由 provider 拥有的选择后副作用                                                             | provider 在模型激活时需要遥测或由 provider 拥有的状态                                                                                         |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的 provider 插件，然后再依次尝试其他具备 hook 能力的 provider 插件，直到某个插件实际更改了模型 id 或传输 / 配置。这样可以让别名 / 兼容 provider shim 继续工作，而无需调用方知道哪个内置插件拥有该重写逻辑。如果没有任何 provider hook 重写受支持的 Google 家族配置项，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果 provider 需要完全自定义的线路协议或自定义请求执行器，那就属于另一类扩展。这些 hooks 用于仍然运行在 OpenClaw 正常推理循环上的 provider 行为。

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

内置 provider 插件会组合使用上述 hooks，以适配各供应商的目录、认证、thinking、重放和用量需求。权威的 hook 集合与各插件一起位于 `extensions/` 下；本页展示的是形态，而不是简单镜像整个列表。

<AccordionGroup>
  <Accordion title="直通式目录 providers">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog`，并配合
    `resolveDynamicModel` / `prepareDynamicModel`，从而能在 OpenClaw 的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点 providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配合使用，以拥有 token 交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理家族">
    共享命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许 providers 通过
    `buildReplayPolicy` 接入转录策略，而不是让每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录 providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专属流辅助工具">
    Beta headers、`/fast` / `serviceTier` 和 `context1m` 位于
    Anthropic 插件的公共 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是位于通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分选定的 core 辅助工具。对于 TTS：

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

- `textToSpeech` 返回文件 / 语音便笺界面所使用的常规 core TTS 输出负载。
- 使用 core `messages.tts` 配置和 provider 选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为 providers 自行重采样 / 编码。
- `listVoices` 对每个 provider 来说都是可选的。可将其用于由供应商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以支持 provider 感知型选择器。
- 当前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

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

- 将 TTS 策略、回退和回复投递保留在 core 中。
- 使用语音 providers 承载由供应商拥有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 首选的归属模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个供应商插件可以同时拥有文本、语音、图像以及未来的媒体 providers。

对于图像 / 音频 / 视频理解，插件应注册一个类型化的
media-understanding provider，而不是通用的键值包：

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

- 将编排、回退、配置和渠道接线保留在 core 中。
- 将供应商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循同样模式：
  - core 拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
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

对于音频转写，插件既可以使用 media-understanding 运行时，
也可以使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享界面。
- 使用 core 的媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当未产生转写输出时（例如输入被跳过 / 不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作为兼容性别名保留。

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

- `provider` 和 `model` 是每次运行可选的覆盖项，而不是持久的会话变更。
- OpenClaw 只会对受信任调用方生效这些覆盖字段。
- 对于由插件拥有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定规范 `provider/model` 目标，或使用 `"*"` 显式允许任意目标。
- 不受信任插件的子智能体运行仍然可用，但覆盖请求会被拒绝，而不是悄悄回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是深入智能体工具接线层：

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

- 将 provider 选择、凭证解析和共享请求语义保留在 core 中。
- 使用 Web 搜索 providers 承载供应商专属搜索传输。
- `api.runtime.webSearch.*` 是功能 / 渠道插件在不依赖智能体工具包装器的情况下需要搜索行为时的首选共享界面。

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

插件可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

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
- `auth`：必填。使用 `"gateway"` 表示需要正常的 Gateway 网关认证，或使用 `"plugin"` 表示由插件管理认证 / webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己已有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。请仅在相同认证级别内保留 `exact` / `prefix` 的贯穿链。
- `auth: "plugin"` 路由**不会**自动获得运维人员运行时作用域。它们用于插件管理的 webhook / 签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由运行在 Gateway 网关请求运行时作用域中，但该作用域有意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 带有受信身份的 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在显式存在该 header 时才会采纳 `x-openclaw-scopes`
  - 对于这些带身份的插件路由请求，如果缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实际规则：不要假设一个使用 gateway 认证的插件路由天然就是管理员界面。如果你的路由需要仅管理员行为，请要求使用带身份的认证模式，并文档化显式的 `x-openclaw-scopes` header 契约。

## 插件 SDK import 路径

编写新插件时，请使用狭义的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。
core 子路径如下：

| 子路径                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语                                       |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口 / 构建辅助工具                            |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括契约                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`）  |

渠道插件应从一组狭义接缝中进行选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。批准行为应收敛到单一的
`approvalCapability` 契约，而不是混用分散在无关插件字段中的行为。请参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它是为旧插件保留的兼容性 shim。新代码应改为导入更狭义的通用原语。
</Info>

仓库内部入口点（每个内置插件 package 根目录）：

- `index.js` — 内置插件入口
- `api.js` — 辅助工具 / 类型 barrel
- `runtime-api.js` — 仅运行时 barrel
- `setup-entry.js` — 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从 core
或其他插件中导入另一个插件 package 的 `src/*`。
通过 facade 加载的入口点会优先使用当前活跃的运行时配置快照；如不存在，则回退到磁盘上的已解析配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专属子路径之所以存在，是因为内置插件今天就在使用它们。它们并不自动等同于长期冻结的外部契约——在依赖它们时，请查看对应的 SDK 参考页面。

## 消息工具 schema

对于反应、已读和投票等非消息原语，插件应拥有渠道专属的 `describeMessageTool(...)` schema 贡献。
共享发送呈现应使用通用的 `MessagePresentation` 契约，而不是 provider 原生的按钮、组件、块或卡片字段。
有关契约、回退规则、provider 映射和插件作者检查清单，请参见 [消息呈现](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明它们能够渲染的内容：

- `presentation` 用于语义呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于固定投递请求

由 core 决定是原生渲染该呈现，还是降级为文本。
不要从通用消息工具中暴露 provider 原生 UI 的逃生口。
为兼容现有第三方插件，面向旧版原生 schemas 的已弃用 SDK 辅助工具仍然保持导出，但新插件不应再使用它们。

## 渠道目标解析

渠道插件应拥有渠道专属的目标语义。请保持共享出站宿主的通用性，并通过消息适配器界面处理 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定某个规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉 core 某个输入是否应直接跳过目录搜索，进入类似 id 的解析
- `messaging.targetResolver.resolveTarget(...)` 是插件回退逻辑，当 core 在规范化之后或目录未命中后仍需要 provider 拥有的最终解析时调用
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后，拥有 provider 专属的会话路由构造逻辑

推荐拆分：

- 对于应在搜索 peers / groups 之前作出的分类决策，请使用 `inferTargetChatType`
- 对于“将此视为显式 / 原生目标 id”的判断，请使用 `looksLikeId`
- 对于 provider 专属的规范化回退，请使用 `resolveTarget`，而不要将其用于广泛的目录搜索
- 请将 provider 原生 id，例如 chat id、thread id、JID、handle 和 room id，保留在 `target` 值或 provider 专属参数中，而不是放进通用 SDK 字段

## 配置支持的目录

如果某个插件会从配置中派生目录项，应将该逻辑保留在插件内，并复用
`openclaw/plugin-sdk/directory-runtime`
中的共享辅助工具。

适用于以下情况：某个渠道需要由配置支持的 peers / groups，例如：

- 基于 allowlist 的私信 peers
- 已配置的渠道 / 群组映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 上限应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道专属的账户检查和 id 规范化应保留在插件实现中。

## provider 目录

provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })`
为推理定义模型目录。

`catalog.run(...)` 返回的结构与 OpenClaw 写入
`models.providers` 中的结构相同：

- `{ provider }` 表示一个 provider 条目
- `{ providers }` 表示多个 provider 条目

当插件拥有 provider 专属的模型 id、base URL 默认值或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 providers 的合并时机：

- `simple`：纯 API key 或环境变量驱动的 providers
- `profile`：存在 auth 配置文件时出现的 providers
- `paired`：合成多个相关 provider 条目的 providers
- `late`：最后一轮，在其他隐式 providers 之后

发生键冲突时，后出现的 provider 会获胜，因此插件可以有意覆盖同一 provider id 的内置 provider 条目。

兼容性说明：

- `discovery` 仍可作为旧版别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了某个渠道，建议在 `resolveAccount(...)` 之外，同时实现
`plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已完全物化，并在缺失必要密钥时快速失败。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor / 配置修复流程等只读命令路径，不应为了描述配置就必须物化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始 token 值。对状态类命令来说，返回 `tokenStatus: "available"`（以及对应的来源字段）就足够了。
- 当凭证是通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样可以让只读命令报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## Package packs

插件目录中可以包含一个带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果 pack 列出了多个 extensions，则插件 id
会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以确保
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接之后，都必须仍位于插件目录内部。任何逃逸出 package 目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时也无开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免那些需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量的、仅用于设置的模块。
当 OpenClaw 需要为已禁用的渠道插件提供设置界面，或者当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整的插件入口。这样在你的主插件入口还会接线工具、hooks 或其他仅运行时代码时，可以让启动和设置保持更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关监听前的启动阶段，即使该渠道已经配置完毕，也改走相同的 `setupEntry` 路径。

只有当 `setupEntry` 能完全覆盖 Gateway 网关开始监听之前必须存在的启动界面时，才应使用它。实际来说，这意味着设置入口必须注册启动所依赖的每一种由渠道拥有的能力，例如：

- 渠道注册本身
- 所有必须在 Gateway 网关开始监听前就可用的 HTTP 路由
- 同一时间窗口中必须存在的所有 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，就不要启用这个标志。应保持默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅用于设置的契约界面辅助工具，以便 core 在完整渠道运行时尚未加载前进行查询。当前的设置提升界面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到
`channels.<id>.accounts.*` 中时，就会使用该界面。
当前的内置示例是 Matrix：当已存在命名账户时，它只会将认证 / 引导键移动到某个命名提升账户中，并且它可以保留一个已配置的、非规范默认账户键，而不总是创建
`accounts.default`。

这些设置补丁适配器使内置契约界面的发现保持惰性。导入时保持轻量；提升界面只在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动界面包含 Gateway 网关 RPC 方法时，请将它们保留在插件专属前缀下。core 管理员命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）始终保留，并且总是解析为
`operator.admin`，即使某个插件请求了更窄的作用域。

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

渠道插件可以通过 `openclaw.channel` 声明设置 / 发现元数据，并通过 `openclaw.install` 声明安装提示。这样可以让 core 目录保持无数据状态。

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

除最小示例之外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录 / 状态界面的次级标签
- `docsLabel`：覆盖文档链接的文本
- `preferOver`：此目录条目应优先于的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面的文案控制
- `markdownCapable`：将渠道标记为支持 Markdown，以用于出站格式决策
- `exposure.configured`：设置为 `false` 时，在已配置渠道列表界面中隐藏该渠道
- `exposure.setup`：设置为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为文档导航界面中的内部 / 私有项
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧版别名；优先使用 `exposure`
- `quickstartAllowFrom`：允许该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析 announce 目标时优先使用 session 查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。你可以将 JSON 文件放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号 / 分号 / `PATH` 分隔）。每个文件应包含
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。
解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排能力，包括摄取、组装和压缩。请在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后使用
`plugins.slots.contextEngine` 选择活跃引擎。

当你的插件需要替换或扩展默认上下文管线，而不只是添加 memory 搜索或 hooks 时，请使用它。

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

当某个插件需要的行为不适合当前 API 时，不要通过私有深度接入绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义 core 契约
   决定 core 应拥有哪些共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义和运行时辅助工具形态。
2. 添加类型化的插件注册 / 运行时界面
   以最小且有用的类型化能力界面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线 core + 渠道 / 功能使用方
   渠道和功能插件应通过 core 消费新能力，
   而不是直接导入某个供应商实现。
4. 注册供应商实现
   然后由供应商插件针对该能力注册其后端实现。
5. 添加契约覆盖
   添加测试，使归属和注册形态随着时间保持明确。

这就是 OpenClaw 保持有主张、同时又不被某个 provider 视角硬编码的方式。具体文件清单和完整示例请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

添加新能力时，实现通常应同时涉及以下界面：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册界面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，位于 `src/plugins/runtime/*`
  中的插件运行时暴露层
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中面向运维 / 插件的文档

如果这些界面中缺少某一项，通常意味着该能力尚未真正集成完成。

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

这样规则就保持简单：

- core 拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试保持归属明确

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [插件 manifest](/zh-CN/plugins/manifest)
