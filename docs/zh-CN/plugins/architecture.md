---
read_when:
    - 构建或调试原生 OpenClaw 插件
    - 理解插件能力模型或归属边界
    - 处理插件加载管线或注册表
    - 实现提供商运行时钩子或渠道插件
sidebarTitle: Internals
summary: 插件内部机制：能力模型、归属、契约、加载管线和运行时辅助工具
title: 插件内部机制
x-i18n:
    generated_at: "2026-04-27T08:00:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b7622b361c6d19069106785f2b80cb3155e58f9a27a2fac9733e976d7c27f13
    source_path: plugins/architecture.md
    workflow: 15
---

这是 OpenClaw 插件系统的**深度架构参考**。如需实用指南，请先从下面其中一个聚焦页面开始。

<CardGroup cols={2}>
  <Card title="安装和使用插件" icon="plug" href="/zh-CN/tools/plugin">
    面向终端用户的指南，介绍如何添加、启用和故障排除插件。
  </Card>
  <Card title="构建插件" icon="rocket" href="/zh-CN/plugins/building-plugins">
    使用最小可运行 manifest 的首个插件教程。
  </Card>
  <Card title="渠道插件" icon="comments" href="/zh-CN/plugins/sdk-channel-plugins">
    构建一个消息渠道插件。
  </Card>
  <Card title="提供商插件" icon="microchip" href="/zh-CN/plugins/sdk-provider-plugins">
    构建一个模型提供商插件。
  </Card>
  <Card title="SDK 概览" icon="book" href="/zh-CN/plugins/sdk-overview">
    import map 和注册 API 参考。
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
| 渠道 / 消息 | `api.registerChannel(...)` | `msteams`, `matrix` |
| Gateway 网关发现 | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

<Note>
一个注册了零能力、但提供钩子、工具、发现服务或后台服务的插件，属于**旧版仅钩子**插件。这种模式仍然得到完整支持。
</Note>

### 外部兼容性立场

能力模型已经在核心中落地，并已被当前内置/原生插件使用，但外部插件兼容性仍需要比“它已导出，因此它已冻结”更严格的标准。

| 插件情况 | 指导建议 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 现有外部插件 | 保持基于钩子的集成继续工作；这是兼容性的基线。 |
| 新的内置/原生插件 | 优先选择显式能力注册，而不是特定厂商的深层接入或新的仅钩子设计。 |
| 采用能力注册的外部插件 | 允许，但除非文档将能力专用辅助接口标记为稳定，否则应将其视为仍在演进中。 |

能力注册是预期的发展方向。在过渡期间，对于外部插件，旧版钩子仍然是最安全、最不容易破坏兼容性的路径。导出的辅助子路径并不都具有同等稳定性——请优先使用文档化的窄接口契约，而不是偶然暴露的辅助导出。

### 插件形态

OpenClaw 会根据每个已加载插件的实际注册行为（而不只是静态元数据）将其归类为某种形态：

<AccordionGroup>
  <Accordion title="plain-capability">
    仅注册一种能力类型（例如仅提供商插件 `mistral`）。
  </Accordion>
  <Accordion title="hybrid-capability">
    注册多种能力类型（例如 `openai` 同时拥有文本推理、语音、媒体理解和图像生成）。
  </Accordion>
  <Accordion title="hook-only">
    仅注册钩子（类型化或自定义），不注册能力、工具、命令或服务。
  </Accordion>
  <Accordion title="non-capability">
    注册工具、命令、服务或路由，但不注册能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力明细。详见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧版钩子

`before_agent_start` 钩子仍然作为仅钩子插件的兼容路径受到支持。现有真实插件仍然依赖它。

方向如下：

- 保持其可用
- 在文档中将其标记为旧版
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 仅在真实使用量下降且夹具覆盖证明迁移安全后再移除

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，可能会看到以下标签之一：

| 信号 | 含义 |
| -------------------------- | ------------------------------------------------------------ |
| **配置有效** | 配置解析正常，且插件解析成功 |
| **兼容性提示** | 插件使用受支持但较旧的模式（例如 `hook-only`） |
| **旧版警告** | 插件使用 `before_agent_start`，该机制已弃用 |
| **硬错误** | 配置无效或插件加载失败 |

`hook-only` 和 `before_agent_start` 目前都不会导致你的插件失效：`hook-only` 只是提示信息，而 `before_agent_start` 只会触发警告。这些信号也会显示在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统分为四层：

<Steps>
  <Step title="Manifest + 设备发现">
    OpenClaw 会从已配置路径、工作区根目录、全局插件根目录以及内置插件中查找候选插件。设备发现会先读取原生 `openclaw.plugin.json` manifest 以及受支持 bundle 的 manifest。
  </Step>
  <Step title="启用 + 验证">
    核心决定已发现的插件是启用、禁用、阻止，还是被选入某个独占槽位（例如 memory）。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容 bundle 会被规范化为注册表记录，而无需导入运行时代码。
  </Step>
  <Step title="表面消费">
    OpenClaw 的其余部分会读取注册表，以暴露工具、渠道、提供商设置、钩子、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

具体到插件 CLI，根命令发现分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 实际的插件 CLI 模块可以保持惰性，并在首次调用时注册

这样既能将插件拥有的 CLI 代码保留在插件内部，又能让 OpenClaw 在解析之前预留根命令名称。

重要的设计边界是：

- manifest/配置验证应当仅依据**manifest/schema 元数据**完成，而不执行插件代码
- 原生能力发现可以加载受信任的插件入口代码，以构建一个不会激活的注册表快照
- 原生运行时行为来自插件模块的 `register(api)` 路径，其中 `api.registrationMode === "full"`

这种拆分让 OpenClaw 能在完整运行时尚未激活前，就验证配置、解释缺失/禁用的插件，并构建 UI/schema 提示。

### 插件查找表

Gateway 网关启动时，会基于当前配置快照中的已安装插件索引和 manifest 注册表构建一个 `PluginLookUpTable`。该表仅包含元数据：存储插件 id、manifest 记录、诊断信息、所有者映射、插件 id 规范化器以及启动插件计划。它不持有已加载的插件模块、提供商 SDK、包内容或运行时导出。

查找表使重复启动决策能够走快速路径：

- 渠道归属
- 延迟渠道启动
- 启动插件 id
- 提供商和 CLI 后端归属
- setup provider、命令别名、模型目录提供商以及 manifest 契约归属

安全边界在于快照替换，而不是变更。配置、插件清单、安装记录或持久化索引策略发生变化时，应重新构建该表。不要将其视为一个可广泛变更的全局注册表，也不要保留无限制的历史表。运行时插件加载仍然独立于查找表元数据，因此过期的运行时状态不会被元数据缓存掩盖。

### 激活规划

激活规划是控制平面的一部分。调用方可以在加载更广泛的运行时注册表之前，询问哪些插件与具体命令、提供商、渠道、路由、Agent harness 或能力相关。

规划器保持当前 manifest 行为兼容：

- `activation.*` 字段是显式的规划提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子仍然是 manifest 归属的回退来源
- 仅返回 id 的规划器 API 仍对现有调用方可用
- 计划 API 会报告原因标签，以便诊断能够区分显式提示和归属回退

<Warning>
不要把 `activation` 当作生命周期钩子或 `register(...)` 的替代品。它是用于缩小加载范围的元数据。若归属字段已经能描述该关系，请优先使用归属字段；仅在需要额外规划提示时使用 `activation`。
</Warning>

### 渠道插件与共享消息工具

对于普通聊天操作，渠道插件无需单独注册发送/编辑/回应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，而渠道插件负责其背后的渠道专属发现与执行。

当前边界如下：

- 核心拥有共享 `message` 工具宿主、提示词接线、会话/线程记账以及执行分发
- 渠道插件拥有作用域操作发现、能力发现以及任何渠道专属 schema 片段
- 渠道插件拥有提供商专属的会话对话语法，例如对话 id 如何编码线程 id，或如何继承父对话
- 渠道插件通过其 action adapter 执行最终操作

对于渠道插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。该统一发现调用允许插件同时返回其可见操作、能力和 schema 贡献，从而避免这些部分发生漂移。

当某个渠道专属消息工具参数携带媒体源（例如本地路径或远程媒体 URL）时，插件还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用这个显式列表来应用沙箱路径规范化和出站媒体访问提示，而无需硬编码插件拥有的参数名。这里应优先使用按操作划分的映射，而不是整个渠道共用的扁平列表，这样仅用于 profile 的媒体参数就不会在 `send` 这类无关操作上被规范化。

核心会将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件很重要。渠道可以根据活动账号、当前房间/线程/消息，或受信任的请求方身份，隐藏或暴露消息操作，而无需在核心 `message` 工具中硬编码渠道专属分支。

这也是为什么嵌入式 runner 路由变更仍然属于插件工作：runner 负责将当前聊天/会话身份转发到插件发现边界，以便共享的 `message` 工具为当前轮次暴露正确的渠道拥有表面。

对于渠道拥有的执行辅助工具，内置插件应将执行运行时保留在它们自己的扩展模块中。核心不再拥有位于 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 消息操作运行时。我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置插件应直接从其扩展自有模块导入本地运行时代码。

相同的边界通常也适用于带提供商名称的 SDK 接缝：核心不应导入针对 Slack、Discord、Signal、WhatsApp 或类似扩展的渠道专用便捷 barrel。如果核心需要某种行为，要么消费内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求提升为共享 SDK 中一个狭义的通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用投票模型渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道专属投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该操作之后，才延迟执行共享投票解析，因此插件自有的投票处理器可以接受渠道专属投票字段，而不会先被通用投票解析器拦住。

完整启动序列请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，而不是一堆彼此无关集成的杂物袋。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外表面
- 功能插件通常应拥有其引入的完整功能表面
- 渠道应消费共享核心能力，而不是临时重复实现提供商行为

<AccordionGroup>
  <Accordion title="供应商多能力">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理，以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理，以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="供应商单能力">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="功能插件">
    `voice-call` 拥有通话传输、工具、CLI、路由和 Twilio 媒体流桥接，但会消费共享的语音、实时转录和实时语音能力，而不是直接导入供应商插件。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- OpenAI 即使同时涵盖文本模型、语音、图像和未来的视频，也仍位于一个插件中
- 其他供应商也可以为其自身的表面采用同样方式
- 渠道不关心哪个供应商插件拥有该提供商；它们消费的是核心暴露的共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 可由多个插件实现或消费的核心契约

因此，如果 OpenClaw 增加像视频这样的新领域，第一个问题不应是“哪个提供商应该硬编码视频处理？”第一个问题应是“核心视频能力契约是什么？”一旦该契约存在，供应商插件就可以针对它注册，渠道/功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 暴露">
    通过插件 API/运行时以类型化方式暴露它。
  </Step>
  <Step title="连接消费者">
    让渠道/功能接入该能力。
  </Step>
  <Step title="供应商实现">
    让供应商插件注册具体实现。
  </Step>
</Steps>

这样既能保持归属明确，又能避免核心行为依赖单一供应商或某个一次性插件专用代码路径。

### 能力分层

在判断代码应放在哪里时，可使用以下思维模型：

<Tabs>
  <Tab title="核心能力层">
    共享的编排、策略、回退、配置合并规则、交付语义和类型化契约。
  </Tab>
  <Tab title="供应商插件层">
    供应商专属 API、认证、模型目录、语音合成、图像生成、未来视频后端、用量端点。
  </Tab>
  <Tab title="渠道/功能插件层">
    Slack/Discord/voice-call 等集成，它们消费核心能力并将其呈现在某个表面上。
  </Tab>
</Tabs>

例如，TTS 遵循这种形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好设置和渠道交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来的能力也应优先采用同样模式。

### 多能力公司插件示例

从外部看，公司插件应具备一致性。如果 OpenClaw 具有针对模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索的共享契约，那么供应商可以在一个地方拥有其全部表面：

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

重要的不是确切的辅助函数名称，而是整体形态：

- 一个插件拥有供应商表面
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件已注册其声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一个共享能力。相同的归属模型也适用于这里：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="供应商插件注册">
    供应商插件按适用情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    渠道和功能插件消费共享核心行为，而不是直接连接到供应商代码。
  </Step>
</Steps>

这样可以避免将某一提供商的视频假设固化进核心。插件拥有供应商表面；核心拥有能力契约和回退行为。

视频生成已经使用同样的顺序：核心拥有类型化能力契约和运行时辅助工具，而供应商插件则针对其注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的发布检查清单？请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

## 契约与强制执行

插件 API 表面被有意设计为类型化，并集中在 `OpenClawPluginApi` 中。该契约定义了受支持的注册点，以及插件可依赖的运行时辅助工具。

这之所以重要，是因为：

- 插件作者可获得一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册相同的提供商 id
- 启动过程可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制约束内置插件归属并防止无声漂移

存在两层强制执行：

<AccordionGroup>
  <Accordion title="运行时注册强制执行">
    插件注册表会在插件加载时验证注册内容。示例：重复的提供商 id、重复的语音提供商 id 以及格式错误的注册，不会产生未定义行为，而会生成插件诊断信息。
  </Accordion>
  <Accordion title="契约测试">
    在测试运行期间，内置插件会被捕获到契约注册表中，以便 OpenClaw 明确断言归属。当前这用于模型提供商、语音提供商、Web 搜索提供商以及内置注册归属。
  </Accordion>
</AccordionGroup>

实际效果是，OpenClaw 能在一开始就知道哪个插件拥有哪些表面。这使核心和渠道能够无缝组合，因为归属是声明式、类型化且可测试的，而不是隐式的。

### 什么应该属于契约

<Tabs>
  <Tab title="好的契约">
    - 类型化
    - 小而精
    - 能力专属
    - 由核心拥有
    - 可被多个插件复用
    - 渠道/功能无需了解供应商即可消费
  </Tab>
  <Tab title="糟糕的契约">
    - 隐藏在核心中的供应商专属策略
    - 绕过注册表的一次性插件逃生口
    - 直接深入某个供应商实现的渠道代码
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象
  </Tab>
</Tabs>

如有疑问，请提升抽象层级：先定义能力，再让插件接入该能力。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们没有经过沙箱隔离。已加载的原生插件与核心代码具有相同的进程级信任边界。

<Warning>
影响包括：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内执行任意代码
  </Warning>

兼容 bundle 默认更安全，因为 OpenClaw 当前将其视为元数据/内容包。在当前版本中，这主要意味着内置的 Skills。

对于非内置插件，请使用 allowlist 和显式的安装/加载路径。应将工作区插件视为开发阶段代码，而不是生产默认值。

对于内置工作区包名，请让插件 id 锚定在 npm 名称中：默认使用 `@openclaw/<id>`，或者在包有意暴露更窄的插件角色时，使用批准的类型化后缀，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任说明：**

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 当工作区插件已启用/加入 allowlist，且其 id 与某个内置插件相同时，它会有意覆盖该内置副本。
- 这属于正常行为，并且对本地开发、补丁测试和热修复很有用。
- 内置插件信任是根据源快照解析的——也就是加载时磁盘上的 manifest 和代码——而不是根据安装元数据解析。损坏或被替换的安装记录不能在实际源码声明范围之外，悄悄扩大内置插件的信任表面。
  </Note>

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷接口。

保持能力注册公开。收紧非契约辅助导出：

- 内置插件专用的辅助子路径
- 不打算作为公开 API 的运行时管线子路径
- 供应商专属的便捷辅助函数
- 属于实现细节的 setup/新手引导辅助函数

出于兼容性和内置插件维护原因，一些内置插件辅助子路径仍然保留在生成的 SDK 导出映射中。当前示例包括 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。应将这些视为保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 内部机制与参考

关于加载管线、注册表模型、提供商运行时钩子、Gateway 网关 HTTP 路由、消息工具 schema、渠道目标解析、提供商目录、上下文引擎插件，以及新增能力的指南，请参见 [插件架构内部机制](/zh-CN/plugins/architecture-internals)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 manifest](/zh-CN/plugins/manifest)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
