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
    generated_at: "2026-04-23T07:06:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e7afebf7eb37d0b8dc245ebbf9b35ca588c91645149e634911f8055780f439
    source_path: plugins/architecture.md
    workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考**。如需实用指南，请参见：
  - [安装和使用插件](/zh-CN/tools/plugin) —— 用户指南
  - [入门指南](/zh-CN/plugins/building-plugins) —— 第一个插件教程
  - [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 构建消息渠道
  - [提供商插件](/zh-CN/plugins/sdk-provider-plugins) —— 构建模型提供商
  - [SDK 概览](/zh-CN/plugins/sdk-overview) —— import map 和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部公开的**原生插件**模型。每个
原生 OpenClaw 插件都会针对一个或多个能力类型进行注册：

| 能力                 | 注册方法                                         | 示例插件                             |
| -------------------- | ------------------------------------------------ | ------------------------------------ |
| 文本推理             | `api.registerProvider(...)`                      | `openai`、`anthropic`                |
| CLI 推理后端         | `api.registerCliBackend(...)`                    | `openai`、`anthropic`                |
| 语音                 | `api.registerSpeechProvider(...)`                | `elevenlabs`、`microsoft`            |
| 实时转录             | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 实时语音             | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒体理解             | `api.registerMediaUnderstandingProvider(...)`    | `openai`、`google`                   |
| 图像生成             | `api.registerImageGenerationProvider(...)`       | `openai`、`google`、`fal`、`minimax` |
| 音乐生成             | `api.registerMusicGenerationProvider(...)`       | `google`、`minimax`                  |
| 视频生成             | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web 抓取             | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 搜索             | `api.registerWebSearchProvider(...)`             | `google`                             |
| 渠道 / 消息传递      | `api.registerChannel(...)`                       | `msteams`、`matrix`                  |

一个注册了零个能力、但提供钩子、工具或
服务的插件，是**旧版仅钩子**插件。这种模式仍然得到完全支持。

### 外部兼容性立场

能力模型已经在核心中落地，并且今天已被内置/原生插件
使用，但外部插件兼容性仍然需要比“它已导出，因此它已冻结”
更严格的标准。

当前指导原则：

- **现有外部插件：** 保持基于钩子的集成继续工作；将其视为
  兼容性基线
- **新的内置/原生插件：** 优先使用显式能力注册，而不是
  供应商专用的深入访问或新的仅钩子设计
- **采用能力注册的外部插件：** 允许这样做，但除非文档明确将某个契约标记为稳定，否则应将能力专用辅助接口视为仍在演进

实用规则：

- 能力注册 API 是预期方向
- 在过渡期间，旧版钩子仍然是外部插件最安全、最不易破坏的路径
- 导出的辅助子路径并不全都等价；优先使用文档化的狭义
  契约，而不是偶然导出的辅助接口

### 插件形态

OpenClaw 会根据每个已加载插件的实际
注册行为（而不仅仅是静态元数据）将其归类为一种形态：

- **plain-capability** —— 恰好注册一种能力类型（例如仅提供商插件，如 `mistral`）
- **hybrid-capability** —— 注册多种能力类型（例如
  `openai` 拥有文本推理、语音、媒体理解和图像
  生成）
- **hook-only** —— 仅注册钩子（类型化或自定义），没有能力、
  工具、命令或服务
- **non-capability** —— 注册工具、命令、服务或路由，但不注册
  能力

使用 `openclaw plugins inspect <id>` 可查看插件的形态和能力
细分。详情请参见 [CLI 参考](/zh-CN/cli/plugins#inspect)。

### 旧版钩子

`before_agent_start` 钩子仍作为仅钩子插件的兼容路径受到支持。现实中的旧版插件仍依赖它。

方向：

- 保持其继续可用
- 在文档中将其标注为旧版
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于提示词变更工作，优先使用 `before_prompt_build`
- 只有在真实使用量下降且 fixture 覆盖证明迁移安全后，才移除它

### 兼容性信号

当你运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到
以下标签之一：

| 信号                     | 含义                                                         |
| ------------------------ | ------------------------------------------------------------ |
| **config valid**         | 配置解析正常，插件解析成功                                   |
| **compatibility advisory** | 插件使用受支持但较旧的模式（例如 `hook-only`）             |
| **legacy warning**       | 插件使用 `before_agent_start`，该项已弃用                    |
| **hard error**           | 配置无效或插件加载失败                                       |

`hook-only` 和 `before_agent_start` 目前都不会破坏你的插件——
`hook-only` 只是提示信息，而 `before_agent_start` 只会触发警告。这些
信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **manifest + 发现**
   OpenClaw 会从已配置路径、工作区根目录、
   全局插件根目录和内置插件中查找候选插件。发现过程会优先读取原生
   `openclaw.plugin.json` manifest 和受支持的 bundle manifest。
2. **启用 + 校验**
   核心决定一个已发现插件是启用、禁用、屏蔽，还是被
   选中用于诸如 memory 之类的独占槽位。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将
   能力注册到中央注册表中。兼容的 bundle 会在不导入运行时代码的情况下
   规范化为注册表记录。
4. **接口消费**
   OpenClaw 的其余部分会读取注册表以暴露工具、渠道、提供商
   设置、钩子、HTTP 路由、CLI 命令和服务。

特别是对于插件 CLI，根命令发现分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真实的插件 CLI 模块可以保持懒加载，并在首次调用时注册

这样可以把插件拥有的 CLI 代码保留在插件内部，同时仍让 OpenClaw
在解析前预留根命令名称。

重要的设计边界：

- 发现 + 配置校验应当仅通过 **manifest/schema 元数据**
  就能工作，而无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种拆分使 OpenClaw 能够在完整运行时尚未激活前，就验证配置、
解释插件缺失/禁用原因，并构建 UI/schema 提示。

### 渠道插件和共享 message 工具

对于常规聊天操作，渠道插件不需要注册单独的发送/编辑/reaction 工具。
OpenClaw 在核心中保留一个共享的 `message` 工具，而渠道插件负责其背后的渠道专用发现与执行。

当前边界是：

- 核心拥有共享 `message` 工具宿主、提示词连线、会话/线程
  记录和执行分发
- 渠道插件拥有作用域化的操作发现、能力发现，以及任何
  渠道专用 schema 片段
- 渠道插件拥有提供商专用的会话对话语法，例如
  对话 ID 如何编码线程 ID 或如何从父对话继承
- 渠道插件通过其 action adapter 执行最终操作

对于渠道插件，SDK 接口是
`ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现
调用允许插件一起返回其可见操作、能力和 schema
贡献，从而避免这些部分相互漂移。

当某个渠道专用 message-tool 参数承载媒体来源，例如
本地路径或远程媒体 URL 时，插件还应从
`describeMessageTool(...)` 返回 `mediaSourceParams`。核心会使用这个显式
列表来应用沙箱路径规范化和出站媒体访问提示，
而无需硬编码插件拥有的参数名称。
在这里优先使用按操作划分的映射，而不是整个渠道范围内的扁平列表，这样
仅配置文件使用的媒体参数就不会在像 `send` 这样的无关操作上被规范化。

核心会把运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对上下文敏感型插件很重要。渠道可以根据活动账户、
当前房间/线程/消息或受信任的请求方身份来隐藏或暴露
消息操作，而无需在核心 `message` 工具中硬编码渠道专用分支。

这就是为什么嵌入式 runner 路由变更仍然属于插件工作：runner
负责将当前聊天/会话身份转发到插件发现边界，以便共享的 `message`
工具为当前轮次暴露正确的渠道拥有接口。

对于渠道拥有的执行辅助工具，内置插件应将执行运行时保留在它们
自己的扩展模块中。核心不再拥有位于 `src/agents/tools` 下的 Discord、
Slack、Telegram 或 WhatsApp 消息操作运行时。
我们不会发布单独的 `plugin-sdk/*-action-runtime` 子路径，内置
插件应直接从自己扩展拥有的模块中导入本地运行时代码。

相同的边界通常也适用于带提供商名称的 SDK 接缝：核心不应
导入 Slack、Discord、Signal、
WhatsApp 或类似扩展的渠道专用便捷 barrel。如果核心需要某种行为，要么
消费该内置插件自己的 `api.ts` / `runtime-api.ts` barrel，要么将该需求
提升为共享 SDK 中的狭义通用能力。

对于投票，具体有两条执行路径：

- `outbound.sendPoll` 是适用于符合通用
  投票模型渠道的共享基线
- `actions.handleAction("poll")` 是处理渠道专用
  投票语义或额外投票参数的首选路径

现在，核心会在插件投票分发拒绝该操作之后，才延迟执行共享投票解析，因此
插件拥有的投票处理器可以接受渠道专用投票字段，而不会先被
通用投票解析器阻塞。

完整启动顺序请参见 [加载流水线](#load-pipeline)。

## 能力归属模型

OpenClaw 将原生插件视为**公司**或**功能**的归属边界，
而不是一堆互不相关集成的集合。

这意味着：

- 公司插件通常应拥有该公司的所有 OpenClaw 对外接口
- 功能插件通常应拥有它引入的完整功能接口
- 渠道应消费共享核心能力，而不是临时重新实现提供商行为

示例：

- 内置的 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 的
  语音 + 实时语音 + 媒体理解 + 图像生成行为
- 内置的 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置的 `microsoft` 插件拥有 Microsoft 语音行为
- 内置的 `google` 插件拥有 Google 模型提供商行为，以及 Google 的
  媒体理解 + 图像生成 + Web 搜索行为
- 内置的 `firecrawl` 插件拥有 Firecrawl Web 抓取行为
- 内置的 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有它们的
  媒体理解后端
- 内置的 `qwen` 插件拥有 Qwen 文本提供商行为，以及
  媒体理解和视频生成行为
- `voice-call` 插件是一个功能插件：它拥有通话传输、工具、
  CLI、路由和 Twilio 媒体流桥接，但它会消费共享的语音
  以及实时转录和实时语音能力，而不是直接导入供应商插件

预期的最终状态是：

- OpenAI 位于一个插件中，即使它涵盖文本模型、语音、图像以及
  未来的视频
- 其他供应商也可以用同样方式处理自己的接口范围
- 渠道不关心哪个供应商插件拥有该提供商；它们消费的是由核心暴露的
  共享能力契约

这是关键区别：

- **plugin** = 归属边界
- **capability** = 多个插件都可以实现或消费的核心契约

因此，如果 OpenClaw 添加一个新领域，例如视频，第一个问题
不是“哪个提供商应该硬编码视频处理？”第一个问题是“什么是
核心视频能力契约？”一旦该契约存在，供应商插件
就可以针对它进行注册，而渠道/功能插件也可以消费它。

如果该能力尚不存在，通常正确的做法是：

1. 在核心中定义缺失的能力
2. 以类型化方式通过插件 API/运行时公开它
3. 让渠道/功能对接到该能力
4. 让供应商插件注册实现

这样可以在保持归属明确的同时，避免核心行为依赖于
单个供应商或某条一次性的插件专用代码路径。

### 能力分层

在决定代码归属位置时，请使用以下心智模型：

- **核心能力层**：共享编排、策略、回退、配置
  合并规则、投递语义和类型化契约
- **供应商插件层**：供应商专用 API、认证、模型目录、语音
  合成、图像生成、未来视频后端、使用情况端点
- **渠道/功能插件层**：Slack/Discord/voice-call 等集成，
  它们消费核心能力并在某个界面上呈现出来

例如，TTS 遵循以下结构：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和渠道投递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

对于未来能力，也应优先采用相同模式。

### 多能力公司插件示例

从外部来看，公司插件应当是内聚的。如果 OpenClaw 具有适用于模型、语音、实时转录、实时语音、媒体
理解、图像生成、视频生成、Web 抓取和 Web 搜索的共享契约，
那么某个供应商就可以在一个地方拥有其所有接口：

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

重要的不是精确的辅助工具名称。重要的是这种结构：

- 一个插件拥有该供应商接口
- 核心仍然拥有能力契约
- 渠道和功能插件消费 `api.runtime.*` 辅助工具，而不是供应商代码
- 契约测试可以断言该插件注册了其声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一种共享
能力。相同的归属模型也适用于这里：

1. 核心定义媒体理解契约
2. 供应商插件按需注册 `describeImage`、`transcribeAudio` 和
   `describeVideo`
3. 渠道和功能插件消费共享核心行为，而不是
   直接连接供应商代码

这样可以避免把某个提供商对视频的假设固化进核心。插件拥有
供应商接口；核心拥有能力契约和回退行为。

视频生成已经采用了相同顺序：核心拥有类型化的
能力契约和运行时辅助工具，而供应商插件则注册
`api.registerVideoGenerationProvider(...)` 实现来对接它。

需要一个具体的发布检查清单吗？请参见
[能力扩展手册](/zh-CN/plugins/architecture)。

## 契约和强制机制

插件 API 接口是有意类型化并集中在
`OpenClawPluginApi` 中的。该契约定义了受支持的注册点，以及
插件可依赖的运行时辅助工具。

这很重要，原因如下：

- 插件作者会获得一个稳定的内部标准
- 核心可以拒绝重复归属，例如两个插件注册同一个
  provider id
- 启动时可以为格式错误的注册暴露可操作的诊断信息
- 契约测试可以强制执行内置插件归属，并防止静默漂移

有两层强制机制：

1. **运行时注册强制机制**
   插件注册表会在插件加载时验证注册内容。例如：
   重复的 provider id、重复的语音 provider id，以及格式错误的
   注册，都会产生插件诊断，而不是未定义行为。
2. **契约测试**
   在测试运行期间，内置插件会被捕获到契约注册表中，因此
   OpenClaw 可以显式断言归属。如今，这用于模型
   providers、语音 providers、Web 搜索 providers，以及内置注册归属。

实际效果是，OpenClaw 能够预先知道，哪个插件拥有哪个
接口。这使核心和渠道能够无缝组合，因为归属是
已声明、已类型化并且可测试的，而不是隐式的。

### 什么内容应属于契约

好的插件契约应该是：

- 类型化的
- 小而精的
- 能力专用的
- 由核心拥有
- 可被多个插件复用
- 可被渠道/功能在不了解供应商的情况下消费

不好的插件契约包括：

- 隐藏在核心中的供应商专用策略
- 绕过注册表的一次性插件逃生口
- 直接深入供应商实现的渠道代码
- 不属于 `OpenClawPluginApi` 或
  `api.runtime` 的临时运行时对象

如有疑问，请提升抽象层级：先定义能力，再
让插件接入它。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在同一进程内**运行。它们
不是沙箱隔离的。已加载的原生插件与核心代码具有相同的进程级信任边界。

其影响包括：

- 原生插件可以注册工具、网络处理器、钩子和服务
- 原生插件中的 bug 可能导致 gateway 崩溃或不稳定
- 恶意原生插件等同于在 OpenClaw 进程内部执行任意代码

兼容 bundle 默认更安全，因为 OpenClaw 目前将它们视为
元数据/内容包。在当前版本中，这主要意味着内置
Skills。

对于非内置插件，请使用允许列表和显式安装/加载路径。将
工作区插件视为开发阶段代码，而不是生产默认值。

对于内置工作区包名，请让插件 id 锚定在 npm
名称中：默认使用 `@openclaw/<id>`，或者使用经批准的类型化后缀，例如
`-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`，当
该包有意暴露更窄的插件角色时。

重要的信任说明：

- `plugins.allow` 信任的是**插件 id**，而不是来源出处。
- 与某个内置插件拥有相同 id 的工作区插件，在该工作区插件被启用/加入允许列表时，会有意覆盖内置副本。
- 这属于正常且有用的行为，适用于本地开发、补丁测试和热修复。
- 内置插件信任是根据源快照解析的——即加载时磁盘上的 manifest 和代码——而不是根据安装元数据解析。损坏或被替换的安装记录无法静默扩大某个内置插件的信任范围，超出实际源代码所声明的内容。

## 导出边界

OpenClaw 导出的是能力，而不是实现层面的便捷接口。

保持能力注册公开。裁剪非契约辅助导出：

- 内置插件专用辅助子路径
- 无意作为公共 API 的运行时管道子路径
- 供应商专用便捷辅助工具
- 属于实现细节的设置/新手引导辅助工具

某些内置插件辅助子路径仍然保留在生成的 SDK 导出
映射中，用于兼容性和内置插件维护。当前示例包括
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 以及若干 `plugin-sdk/matrix*` 接缝。请将这些视为
保留的实现细节导出，而不是新第三方插件推荐采用的 SDK 模式。

## 加载流水线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块——已构建的 `dist/*` 内置模块会走
   原生加载器路径，而未构建的原生插件模块会通过
   jiti 加载
7. 调用原生 `register(api)`（或 `activate(api)`——旧版别名）钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时接口

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析存在的那一个（`def.register ?? def.activate`），并在相同位置调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门会在运行时执行**之前**发生。当候选项满足以下条件时会被阻止：
入口逃逸出插件根目录、路径对所有人可写，或者对于非内置插件来说路径所有权看起来可疑。

### Manifest-first 行为

manifest 是控制平面的真实来源。OpenClaw 用它来：

- 标识插件
- 发现已声明的渠道/Skills/配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下保留轻量的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册
实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍属于控制平面。
它们是用于激活规划和设置发现的纯元数据描述符；
并不能替代运行时注册、`register(...)` 或 `setupEntry`。
当前首批实时激活使用方现在会使用 manifest 中的命令、渠道和提供商提示，
在更广泛的注册表实体化之前先缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求
  channel id 的插件
- 显式提供商设置/运行时解析会缩小到拥有所请求 provider id 的插件

设置发现现在优先使用描述符拥有的 ID，例如 `setup.providers` 和
`setup.cliBackends`，先缩小候选插件范围，然后才会回退到
`setup-api`，用于那些仍然需要设置时运行时钩子的插件。
如果多个已发现插件声称拥有相同规范化后的 setup provider 或 CLI backend
id，设置查找会拒绝这个歧义归属，而不是依赖发现顺序。

### 加载器缓存的内容

OpenClaw 会为以下内容保留短期的进程内缓存：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动和重复命令开销。可以安全地将它们视为
短生命周期的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改随意的核心全局状态。它们会注册到
中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后核心功能会从该注册表读取，而不是直接与插件模块通信。
这使加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数核心接口只
需要一个集成点：“读取注册表”，而不是“为每个插件模块写特殊处理”。

## 对话绑定回调

绑定某个对话的插件可以在批准结果确定时作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定
请求获批或被拒后接收回调：

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
- `binding`：已批准请求的解析后绑定
- `request`：原始请求摘要、detach 提示、sender id 以及
  对话元数据

该回调仅用于通知。它不会改变谁被允许绑定某个
对话，并且会在核心批准处理完成后运行。

## 提供商运行时钩子

提供商插件现在有两层：

- manifest 元数据：`providerAuthEnvVars` 用于在运行时加载前进行低成本的提供商环境认证查找，
  `providerAuthAliases` 用于共享认证的提供商变体，
  `channelEnvVars` 用于在运行时
  加载前进行低成本的渠道环境/设置查找，以及 `providerAuthChoices` 用于在运行时加载前提供低成本的新手引导/认证选择标签和
  CLI 标志元数据
- 配置时钩子：`catalog` / 旧版 `discovery` 以及 `applyConfigDefaults`
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

OpenClaw 仍然拥有通用智能体循环、故障切换、对话记录处理和
工具策略。这些钩子是在不需要完整自定义推理传输的情况下，为提供商专用行为提供的扩展接口。

当提供商具有基于环境变量的凭证，并且通用认证/状态/模型选择器路径应当在不加载插件运行时的情况下看到这些凭证时，请使用 manifest `providerAuthEnvVars`。
当某个 provider id 应复用另一个 provider id 的环境变量、认证配置文件、配置支持的认证和 API 密钥新手引导选项时，请使用 manifest `providerAuthAliases`。
当新手引导/认证选择 CLI 界面应在不加载提供商运行时的情况下，了解该提供商的选择 ID、分组标签和简单单标志认证接线时，请使用 manifest `providerAuthChoices`。
将提供商运行时的 `envVars` 保留给面向运维人员的提示，例如新手引导标签或 OAuth
client-id/client-secret 设置环境变量。

当某个渠道具有由环境变量驱动的认证或设置，并且通用 shell 环境变量回退、配置/状态检查或设置提示应当在不加载渠道运行时的情况下看到它时，请使用 manifest `channelEnvVars`。

### 钩子顺序和使用方式

对于模型/提供商插件，OpenClaw 大致按以下顺序调用钩子。
“何时使用”这一列是快速决策指南。

| #   | 钩子                              | 功能                                                                                                           | 何时使用                                                                                                                                      |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中                                            | 提供商拥有目录，或拥有基础 URL 默认值                                                                                                         |
| 2   | `applyConfigDefaults`             | 在配置实体化期间应用由提供商拥有的全局配置默认值                                                              | 默认值依赖于认证模式、环境变量或提供商模型家族语义                                                                                           |
| --  | _(内置模型查找)_                  | OpenClaw 会先尝试常规注册表/目录路径                                                                           | _(不是插件钩子)_                                                                                                                              |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版 model-id 别名                                                                       | 提供商拥有在规范模型解析前进行的别名清理逻辑                                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化同一传输家族中的提供商家族 `api` / `baseUrl`                                            | 提供商拥有针对同一传输家族中自定义 provider id 的传输清理逻辑                                                                                |
| 5   | `normalizeConfig`                 | 在运行时/提供商解析前规范化 `models.providers.<id>`                                                            | 提供商需要应与插件一同维护的配置清理逻辑；内置的 Google 家族辅助工具也会为受支持的 Google 配置条目提供兜底                                  |
| 6   | `applyNativeStreamingUsageCompat` | 将原生流式使用情况兼容重写应用到配置提供商                                                                     | 提供商需要基于端点的原生流式使用情况元数据修复                                                                                               |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证前，为配置提供商解析 env-marker 认证                                                           | 提供商拥有自己的 env-marker API 密钥解析逻辑；`amazon-bedrock` 在这里也有内置的 AWS env-marker 解析器                                        |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的前提下暴露本地/自托管或配置支持的认证                                                          | 提供商可以通过合成/本地凭证标记运行                                                                                                          |
| 9   | `resolveExternalAuthProfiles`     | 叠加由提供商拥有的外部认证配置文件；默认 `persistence` 为 `runtime-only`，用于 CLI/应用拥有的凭证            | 提供商在不持久化复制的 refresh token 的情况下复用外部认证凭证；需在 manifest 中声明 `contracts.externalAuthProviders`                        |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符降到 env/配置支持的认证之后                                                       | 提供商会存储不应获得更高优先级的合成占位配置文件                                                                                             |
| 11  | `resolveDynamicModel`             | 为尚未出现在本地注册表中的提供商模型 ID 提供同步回退解析                                                      | 提供商接受任意上游模型 ID                                                                                                                    |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel`                                                             | 提供商在解析未知 ID 之前需要网络元数据                                                                                                       |
| 13  | `normalizeResolvedModel`          | 在嵌入式 runner 使用解析后模型之前进行最终重写                                                                 | 提供商需要传输重写，但仍使用核心传输                                                                                                         |
| 14  | `contributeResolvedModelCompat`   | 为经由另一个兼容传输的供应商模型贡献兼容标志                                                                   | 提供商可在不接管该提供商的情况下，通过代理传输识别自己的模型                                                                                 |
| 15  | `capabilities`                    | 由提供商拥有、供共享核心逻辑使用的对话记录/工具元数据                                                         | 提供商需要处理对话记录/提供商家族特有的差异                                                                                                 |
| 16  | `normalizeToolSchemas`            | 在嵌入式 runner 看到工具 schema 之前对其进行规范化                                                            | 提供商需要进行传输家族级 schema 清理                                                                                                         |
| 17  | `inspectToolSchemas`              | 在规范化后暴露由提供商拥有的 schema 诊断信息                                                                   | 提供商希望给出关键字警告，而无需让核心了解提供商专用规则                                                                                     |
| 18  | `resolveReasoningOutputMode`      | 选择原生推理输出契约还是带标签的推理输出契约                                                                   | 提供商需要使用带标签的推理/最终输出，而不是原生字段                                                                                         |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前进行请求参数规范化                                                                       | 提供商需要默认请求参数，或进行按提供商划分的参数清理                                                                                         |
| 20  | `createStreamFn`                  | 用自定义传输完全替换常规流式路径                                                                               | 提供商需要自定义线路协议，而不只是包装器                                                                                                     |
| 21  | `wrapStreamFn`                    | 在应用通用包装器后再对流函数进行包装                                                                           | 提供商需要请求头/请求体/模型兼容包装器，但不需要自定义传输                                                                                   |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输头或元数据                                                                                   | 提供商希望通用传输发送提供商原生的轮次身份                                                                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略                                                                        | 提供商希望通用 WS 传输调节会话请求头或回退策略                                                                                               |
| 24  | `formatApiKey`                    | auth-profile 格式化器：将存储的配置文件转换为运行时 `apiKey` 字符串                                            | 提供商存储额外认证元数据，并需要自定义运行时令牌格式                                                                                         |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑                                                              | 提供商不适用于共享的 `pi-ai` 刷新器                                                                                                          |
| 26  | `buildAuthDoctorHint`             | 在 OAuth 刷新失败时附加修复提示                                                                                | 提供商在刷新失败后需要提供由自己拥有的认证修复指导                                                                                           |
| 27  | `matchesContextOverflowError`     | 由提供商拥有的上下文窗口溢出匹配器                                                                             | 提供商存在通用启发式无法识别的原始溢出错误                                                                                                   |
| 28  | `classifyFailoverReason`          | 由提供商拥有的故障切换原因分类                                                                                 | 提供商可以将原始 API/传输错误映射为 rate-limit/overload 等类型                                                                               |
| 29  | `isCacheTtlEligible`              | 面向代理/回程提供商的提示词缓存策略                                                                            | 提供商需要代理专用的缓存 TTL 门控                                                                                                            |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失认证恢复消息                                                                                     | 提供商需要提供商专用的缺失认证恢复提示                                                                                                       |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，并可附带面向用户的错误提示                                                                   | 提供商需要隐藏过时的上游条目，或用供应商提示替换它们                                                                                         |
| 32  | `augmentModelCatalog`             | 在发现后追加合成/最终目录行                                                                                    | 提供商需要在 `models list` 和选择器中加入前向兼容的合成条目                                                                                  |
| 33  | `resolveThinkingProfile`          | 模型专用的 `/think` 级别集、显示标签和默认值                                                                   | 提供商为选定模型暴露自定义 thinking 阶梯或二元标签                                                                                           |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容钩子                                                                                          | 提供商仅暴露二元的 thinking 开/关                                                                                                            |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容钩子                                                                                       | 提供商只希望在部分模型上启用 `xhigh`                                                                                                         |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容钩子                                                                                     | 提供商拥有某个模型家族的默认 `/think` 策略                                                                                                   |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和冒烟选择的现代模型匹配器                                                                 | 提供商拥有实时/冒烟首选模型匹配逻辑                                                                                                           |
| 38  | `prepareRuntimeAuth`              | 在推理前将已配置凭证交换为实际运行时令牌/密钥                                                                  | 提供商需要令牌交换或短生命周期请求凭证                                                                                                       |
| 39  | `resolveUsageAuth`                | 为 `/usage` 和相关状态界面解析使用情况/计费凭证                                                                | 提供商需要自定义使用情况/配额令牌解析，或需要不同的使用情况凭证                                                                              |
| 40  | `fetchUsageSnapshot`              | 在认证解析后获取并规范化提供商专用的使用情况/配额快照                                                         | 提供商需要提供商专用的使用情况端点或负载解析器                                                                                                |
| 41  | `createEmbeddingProvider`         | 为 memory/search 构建由提供商拥有的嵌入适配器                                                                  | memory 嵌入行为应归属于提供商插件                                                                                                            |
| 42  | `buildReplayPolicy`               | 返回控制该提供商对话记录处理方式的重放策略                                                                     | 提供商需要自定义对话记录策略（例如移除 thinking 块）                                                                                         |
| 43  | `sanitizeReplayHistory`           | 在通用对话记录清理之后重写重放历史                                                                             | 提供商需要超出共享压缩辅助工具范围的提供商专用重放重写                                                                                       |
| 44  | `validateReplayTurns`             | 在嵌入式 runner 之前对重放轮次进行最终验证或重塑                                                               | 提供商传输在通用净化之后需要更严格的轮次验证                                                                                                 |
| 45  | `onModelSelected`                 | 当某个模型变为活动状态时运行由提供商拥有的选择后副作用                                                         | 提供商在模型激活时需要遥测或提供商自有状态                                                                                                   |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查
匹配到的提供商插件，然后继续落到其他具备相应钩子能力的提供商插件，
直到其中某个插件实际修改了模型 ID 或传输/配置为止。
这样可以让别名/兼容提供商 shim 持续工作，而不要求调用方知道
哪个内置插件拥有该重写逻辑。如果没有任何提供商钩子重写某个受支持的
Google 家族配置条目，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线路协议或自定义请求执行器，
那属于另一类扩展。这些钩子适用于仍在 OpenClaw 正常推理循环上运行的
提供商行为。

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
  提供商家族提示、认证修复指导、使用情况端点集成、
  提示词缓存适用性、感知认证的配置默认值、Claude
  默认/自适应 thinking 策略，以及面向
  beta headers、`/fast` / `serviceTier` 和 `context1m` 的 Anthropic 专用流式整形。
- Anthropic 的 Claude 专用流辅助工具目前保留在该内置插件自己的
  公共 `api.ts` / `contract-api.ts` 接缝中。该包接口
  导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的
  Anthropic wrapper builder，而不是仅为了某个提供商的 beta-header 规则去扩大通用 SDK。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和
  `capabilities`，以及 `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`resolveThinkingProfile` 和 `isModernModelRef`，
  因为它拥有 GPT-5.4 前向兼容、直接的 OpenAI
  `openai-completions` -> `openai-responses` 规范化、感知 Codex 的认证
  提示、Spark 抑制、合成的 OpenAI 列表行，以及 GPT-5 thinking /
  实时模型策略；`openai-responses-defaults` 流家族拥有共享的原生 OpenAI Responses 包装器，用于 attribution headers、
  `/fast`/`serviceTier`、文本 verbosity、原生 Codex Web 搜索、
  推理兼容负载整形和 Responses 上下文管理。
- OpenRouter 使用 `catalog`，以及 `resolveDynamicModel` 和
  `prepareDynamicModel`，因为该提供商是透传型的，可能会在
  OpenClaw 的静态目录更新前暴露新的模型 ID；它还使用
  `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以将
  提供商专用请求头、路由元数据、推理补丁和
  提示词缓存策略保留在核心之外。其重放策略来自
  `passthrough-gemini` 家族，而 `openrouter-thinking` 流家族
  拥有代理推理注入以及对不受支持模型 / `auto` 的跳过逻辑。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和
  `capabilities`，以及 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，因为它
  需要由提供商拥有的设备登录、模型回退行为、Claude 对话记录
  差异、GitHub token -> Copilot token 交换，以及由提供商拥有的使用情况端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog`，以及
  `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它
  仍运行在核心 OpenAI 传输之上，但拥有自己的传输/base URL
  规范化、OAuth 刷新回退策略、默认传输选择、
  合成 Codex 目录行，以及 ChatGPT 使用情况端点集成；它
  与直接 OpenAI 共享同一个 `openai-responses-defaults` 流家族。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn` 和 `isModernModelRef`，因为
  `google-gemini` 重放家族拥有 Gemini 3.1 前向兼容回退、
  原生 Gemini 重放校验、bootstrap 重放净化、带标签的
  推理输出模式以及现代模型匹配，而
  `google-thinking` 流家族拥有 Gemini thinking 负载规范化；
  Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和
  `fetchUsageSnapshot` 来处理令牌格式化、令牌解析和配额端点
  接线。
- Anthropic Vertex 通过
  `anthropic-by-model` 重放家族使用 `buildReplayPolicy`，这样 Claude 专用重放清理就能仅限于 Claude ID，而不是作用于每个 `anthropic-messages` 传输。
- Amazon Bedrock 使用 `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason` 和 `resolveThinkingProfile`，因为它拥有
  面向 Anthropic-on-Bedrock 流量的 Bedrock 专用 throttle/not-ready/context-overflow 错误分类；
  其重放策略仍共享同一个
  仅限 Claude 的 `anthropic-by-model` 防护。
- OpenRouter、Kilocode、Opencode 和 Opencode Go 通过 `buildReplayPolicy`
  使用 `passthrough-gemini` 重放家族，因为它们通过 OpenAI 兼容传输代理 Gemini
  模型，并且需要 Gemini
  thought-signature 净化，而不需要原生 Gemini 重放校验或
  bootstrap 重写。
- MiniMax 通过
  `hybrid-anthropic-openai` 重放家族使用 `buildReplayPolicy`，因为一个提供商同时拥有
  Anthropic-message 和 OpenAI 兼容语义；它会在 Anthropic
  一侧保留仅限 Claude 的 thinking 块丢弃，同时将推理
  输出模式覆盖回原生，而 `minimax-fast-mode` 流家族则拥有
  共享流路径上的 fast-mode 模型重写。
- Moonshot 使用 `catalog`、`resolveThinkingProfile` 和 `wrapStreamFn`，因为它仍然使用共享的
  OpenAI 传输，但需要由提供商拥有的 thinking 负载规范化；`moonshot-thinking` 流家族会将配置和 `/think` 状态映射到其原生的二元 thinking 负载。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和
  `isCacheTtlEligible`，因为它需要由提供商拥有的请求头、
  推理负载规范化、Gemini 对话记录提示和 Anthropic
  缓存 TTL 门控；`kilocode-thinking` 流家族会在共享代理流路径上保留 Kilo thinking
  注入，同时跳过 `kilo/auto` 及其他
  不支持显式推理负载的代理模型 ID。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`resolveThinkingProfile`、`isModernModelRef`、
  `resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、
  `tool_stream` 默认值、二元 thinking UX、现代模型匹配，以及
  使用情况认证 + 配额获取；`tool-stream-default-on` 流家族会把默认开启的 `tool_stream` 包装器保留在每提供商手写 glue 之外。
- xAI 使用 `normalizeResolvedModel`、`normalizeTransport`、
  `contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、
  `resolveSyntheticAuth`、`resolveDynamicModel` 和 `isModernModelRef`，
  因为它拥有原生 xAI Responses 传输规范化、Grok fast-mode
  别名重写、默认 `tool_stream`、strict-tool / 推理负载
  清理、对插件拥有工具的回退认证复用、前向兼容的 Grok
  模型解析，以及由提供商拥有的兼容补丁，例如 xAI 工具 schema
  配置、不可支持的 schema 关键字、原生 `web_search` 和 HTML 实体
  工具调用参数解码。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities`，
  以便将对话记录/工具差异保留在核心之外。
- 仅目录型内置提供商，例如 `byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、
  `synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`，仅使用
  `catalog`。
- Qwen 对其文本提供商使用 `catalog`，并通过共享的媒体理解和
  视频生成注册来处理其多模态接口。
- MiniMax 和 Xiaomi 使用 `catalog` 加上使用情况钩子，因为它们的 `/usage`
  行为归插件所有，即使推理仍通过共享传输运行。

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

注意：

- `textToSpeech` 返回适用于文件/语音便笺界面的正常核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商重新采样/编码。
- `listVoices` 对某些提供商而言是可选的。可将其用于供应商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如 locale、gender 和 personality tags，以便用于感知提供商的选择器。
- 当前 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

插件还可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

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

注意：

- 将 TTS 策略、回退和回复投递保留在核心中。
- 使用语音提供商处理由供应商拥有的合成行为。
- 旧版 Microsoft `edge` 输入会规范化为 `microsoft` provider id。
- 首选的归属模型是面向公司的：随着 OpenClaw 添加这些
  能力契约，一个供应商插件可以拥有文本、语音、图像和未来媒体
  提供商。

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

注意：

- 将编排、回退、配置和渠道接线保留在核心中。
- 将供应商行为保留在提供商插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选
  结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
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
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享接口。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时，返回 `{ text: undefined }`（例如输入被跳过/不受支持）。
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

注意：

- `provider` 和 `model` 是每次运行的可选覆盖，不是持久化的会话变更。
- OpenClaw 仅对受信任的调用方应用这些覆盖字段。
- 对于插件拥有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 显式允许任意目标。
- 不受信任的插件子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是
深入智能体工具接线：

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

插件还可以通过
`api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

注意：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商处理供应商专用搜索传输。
- `api.runtime.webSearch.*` 是需要搜索行为而又不依赖智能体工具包装器的功能/渠道插件的首选共享接口。

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
- `auth`：必填。使用 `"gateway"` 表示要求常规 Gateway 网关认证，或使用 `"plugin"` 表示插件自管认证/webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换自己已有的路由注册。
- `handler`：当路由已处理请求时返回 `true`。

注意：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 完全相同的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别下保留 `exact`/`prefix` 级联链。
- `auth: "plugin"` 路由**不会**自动获得运维人员运行时作用域。它们用于插件自管的 webhook/签名校验，而不是特权的 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域是有意保守的：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes` 也是如此
  - 受信任的带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅会在显式提供该请求头时应用 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实用规则：不要假设通过 gateway-auth 的插件路由天然就是管理员接口。如果你的路由需要仅管理员可用的行为，请要求使用带身份的认证模式，并记录明确的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写插件时，请使用 SDK 子路径，而不是整体式的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry`：用于插件注册原语。
- `openclaw/plugin-sdk/core`：用于通用共享的面向插件契约。
- `openclaw/plugin-sdk/config-schema`：用于根级 `openclaw.json` Zod schema
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
  `openclaw/plugin-sdk/secret-input` 和
  `openclaw/plugin-sdk/webhook-ingress`，用于共享设置/认证/回复/webhook
  接线。`channel-inbound` 是 debounce、提及匹配、
  入站提及策略辅助工具、信封格式化以及入站信封
  上下文辅助工具的共享归属位置。
  `channel-setup` 是狭义的可选安装设置接缝。
  `setup-runtime` 是 `setupEntry` /
  延迟启动使用的运行时安全设置接口，包括对导入安全的设置补丁适配器。
  `setup-adapter-runtime` 是感知环境变量的账户设置适配器接缝。
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
  `openclaw/plugin-sdk/runtime-store` 和
  `openclaw/plugin-sdk/directory-runtime`，用于共享运行时/配置辅助工具。
  `telegram-command-config` 是 Telegram 自定义
  命令规范化/校验的狭义公共接缝，即使内置
  Telegram 契约接口暂时不可用，它仍然可用。
  `text-runtime` 是共享的文本/Markdown/日志接缝，包括
  助手可见文本剥离、Markdown 渲染/分块辅助工具、脱敏
  辅助工具、directive-tag 辅助工具以及安全文本工具。
- 审批专用渠道接缝应优先在插件上使用一个 `approvalCapability`
  契约。然后核心会通过这一项能力读取审批认证、投递、渲染、
  原生路由和延迟原生处理器行为，而不是把审批行为混进不相关的插件字段中。
- `openclaw/plugin-sdk/channel-runtime` 已弃用，只作为
  旧插件的兼容性 shim 保留。新代码应改为导入更狭义的
  通用原语，仓库代码也不应新增对该 shim 的导入。
- 内置扩展内部实现仍然是私有的。外部插件应只使用
  `openclaw/plugin-sdk/*` 子路径。OpenClaw 核心/测试代码可以使用插件包根目录下的仓库公共入口点，例如 `index.js`、`api.js`、
  `runtime-api.js`、`setup-entry.js`，以及狭义文件，例如
  `login-qr-api.js`。绝不要从核心或其他扩展中导入某个插件包的 `src/*`。
- 仓库入口点拆分：
  `<plugin-package-root>/api.js` 是辅助工具/类型 barrel，
  `<plugin-package-root>/runtime-api.js` 是仅运行时 barrel，
  `<plugin-package-root>/index.js` 是内置插件入口，
  `<plugin-package-root>/setup-entry.js` 是设置插件入口。
- 当前内置提供商示例：
  - Anthropic 使用 `api.js` / `contract-api.js` 处理 Claude 流辅助工具，例如
    `wrapAnthropicProviderStream`、beta-header 辅助工具和 `service_tier`
    解析。
  - OpenAI 使用 `api.js` 处理提供商 builder、默认模型辅助工具和
    实时提供商 builder。
  - OpenRouter 使用 `api.js` 处理其提供商 builder 以及新手引导/配置
    辅助工具，而 `register.runtime.js` 仍可为仓库内本地使用重新导出通用
    `plugin-sdk/provider-stream` 辅助工具。
- facade 加载的公共入口点在存在活动运行时配置快照时优先使用它，
  否则在 OpenClaw 尚未提供运行时快照时回退到磁盘上的解析后配置文件。
- 通用共享原语仍然是首选的公共 SDK 契约。仍然存在一小组保留的、带内置渠道品牌的辅助工具接缝，用于兼容性。请将这些视为内置维护/兼容接缝，而不是新的第三方导入目标；新的跨渠道契约仍应落在通用 `plugin-sdk/*` 子路径或插件本地 `api.js` /
  `runtime-api.js` barrel 上。

兼容性说明：

- 新代码应避免使用根级 `openclaw/plugin-sdk` barrel。
- 优先使用狭义且稳定的原语。较新的 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 子路径，是新内置和外部插件工作的预期契约。
  目标解析/匹配应放在 `openclaw/plugin-sdk/channel-targets`。
  消息操作门控和 reaction message-id 辅助工具应放在
  `openclaw/plugin-sdk/channel-actions`。
- 默认情况下，内置扩展专用辅助工具 barrel 并不稳定。如果某个
  辅助工具只被某个内置扩展需要，请将其保留在该扩展本地的 `api.js` 或 `runtime-api.js` 接缝后面，而不是将其提升到
  `openclaw/plugin-sdk/<extension>` 中。
- 新的共享辅助工具接缝应是通用的，而不是带渠道品牌的。共享目标
  解析应放在 `openclaw/plugin-sdk/channel-targets`；渠道专用
  内部实现应保留在归属插件的本地 `api.js` 或 `runtime-api.js`
  接缝后面。
- `image-generation`、
  `media-understanding` 和 `speech` 等能力专用子路径之所以存在，是因为内置/原生插件
  当前就在使用它们。它们的存在本身并不意味着每个导出的辅助工具都是长期冻结的外部契约。

## Message 工具 schema

插件应拥有针对非消息原语（例如 reactions、已读和 polls）的
渠道专用 `describeMessageTool(...)` schema
贡献。共享发送展示应使用通用的 `MessagePresentation` 契约，
而不是提供商原生的 button、component、block 或 card 字段。
契约、回退规则、提供商映射和插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明其可渲染内容：

- `presentation`：用于语义化展示块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`：用于固定投递请求

核心决定是原生渲染该展示，还是将其降级为文本。
不要从通用 message 工具中暴露提供商原生 UI 逃生口。
为旧版原生 schema 保留的已弃用 SDK 辅助工具仍会导出，以兼容现有
第三方插件，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道专用的目标语义。请保持共享
出站宿主是通用的，并使用消息适配器接口处理提供商规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标
  在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个
  输入是否应直接跳到类似 ID 的解析，而不是目录搜索。
- `messaging.targetResolver.resolveTarget(...)` 是在
  规范化后或目录未命中后，核心需要最终由提供商拥有的解析时，插件使用的回退路径。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后
  拥有提供商专用的会话路由构造逻辑。

推荐拆分：

- 对于应在搜索 peers/groups 之前发生的类别决策，使用 `inferTargetChatType`。
- 对于“将其视为显式/原生目标 ID”的检查，使用 `looksLikeId`。
- 将 `resolveTarget` 用于提供商专用规范化回退，而不是广泛的目录搜索。
- 将聊天 ID、线程 ID、JID、handle 和房间
  ID 等提供商原生 ID 保留在 `target` 值或提供商专用参数中，而不是放在通用 SDK 字段中。

## 配置支持的目录

如果插件从配置派生目录条目，请将该逻辑保留在
插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要配置支持的 peers/groups 时，请使用这种方式，例如：

- 由允许列表驱动的私信 peers
- 已配置的渠道/群组映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道专用的账户检查和 ID 规范化应保留在
插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 相同的结构：

- `{ provider }`：单个提供商条目
- `{ providers }`：多个提供商条目

当插件拥有提供商专用模型 ID、base URL 默认值或受认证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw
内置隐式提供商的合并时机：

- `simple`：普通 API 密钥或环境变量驱动的提供商
- `profile`：当存在认证配置文件时出现的提供商
- `paired`：会合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后出现的提供商在键冲突时获胜，因此插件可以有意用相同 provider id 覆盖内置提供商条目。

兼容性：

- `discovery` 仍可作为旧版别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并与 `resolveAccount(...)` 一起提供。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证
  已完全实体化，并且在缺少必需密钥时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 Doctor/配置
  修复流程，不应为了描述配置而必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读
  可用性而返回原始令牌值。对于类似状态的命令，返回 `tokenStatus: "available"`（以及匹配的来源字段）就足够了。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样可以让只读命令报告“已配置但在当前命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## 包集合

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

每个条目都会成为一个插件。如果该包列出了多个扩展，插件 id
会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析 symlink 后都必须保留在插件
目录内。逃逸出包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时不安装 dev dependencies）。请保持插件依赖
树为“纯 JS/TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。
当 OpenClaw 需要为一个已禁用的渠道插件提供设置接口时，或者
当某个渠道插件已启用但仍未配置时，它会加载 `setupEntry`
而不是完整插件入口。这样可以在你的主插件入口还会接线工具、钩子或其他仅运行时代码时，让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关的
监听前启动阶段，即使渠道已经配置好，也选择使用相同的 `setupEntry` 路径。

只有当 `setupEntry` 完全覆盖了 gateway 开始监听前
必须存在的启动接口时，才使用此选项。实践中，这意味着设置入口
必须注册启动所依赖的每一项渠道拥有能力，例如：

- 渠道注册本身
- 任何必须在 gateway 开始监听前可用的 HTTP 路由
- 任何在同一时间窗口内必须存在的 gateway 方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用
此标志。保持插件使用默认行为，并让 OpenClaw 在启动期间加载
完整入口。

内置渠道还可以发布仅设置用的契约接口辅助工具，以便核心
在完整渠道运行时加载前进行查询。当前的设置
提升接口是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账户渠道
配置提升到 `channels.<id>.accounts.*` 时，会使用该接口。
Matrix 是当前的内置示例：当已存在具名账户时，它只会将认证/bootstrap 键移动到某个已提升的具名账户中，并且可以保留已配置的非规范默认账户键，而不是总是创建
`accounts.default`。

这些设置补丁适配器让内置契约接口发现保持懒加载。导入
时间保持轻量；提升接口只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动接口包含 Gateway 网关 RPC 方法时，请将它们保留在
插件专用前缀下。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且总是解析
为 `operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 广告设置/发现元数据，并通过 `openclaw.install` 提供安装提示。这样可以让核心目录不携带数据。

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

除最小示例外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录/状态界面的次级标签
- `docsLabel`：用于覆盖文档链接的链接文本
- `preferOver`：该目录条目应优先于的低优先级 plugin/channel id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，用于出站格式化决策
- `exposure.configured`：设为 `false` 时，在已配置渠道列表界面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：在文档导航界面中将该渠道标记为内部/私有
- `showConfigured` / `showInSetup`：旧版别名，出于兼容性仍然接受；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，负责摄取、组装
和压缩。通过
`api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文
流水线，而不是仅仅添加 memory 搜索或钩子时，请使用这种方式。

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

当某个插件需要当前 API 无法容纳的行为时，不要通过私有深入访问
绕过插件系统。请添加缺失的能力。

推荐顺序：

1. 定义核心契约
   决定应由核心拥有的共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具结构。
2. 添加类型化的插件注册/运行时接口
   使用最小但有用的
   类型化能力接口扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 对接核心 + 渠道/功能使用方
   渠道和功能插件应通过核心消费新能力，
   而不是直接导入某个供应商实现。
4. 注册供应商实现
   然后由供应商插件针对该能力注册其后端。
5. 添加契约覆盖
   添加测试，使归属和注册结构能够随着时间推移保持明确。

这就是 OpenClaw 在保持有主见的同时，又不会被硬编码到某一个
提供商世界观中的方式。具体文件清单和示例请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，通常应同时涉及以下
接口：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道
  插件需要消费它时，位于 `src/plugins/runtime/*` 的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属/契约断言
- `docs/` 中的运维人员/插件文档

如果缺少其中某个接口，通常说明该能力
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

这样可以保持规则简单：

- 核心拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能/渠道插件消费运行时辅助工具
- 契约测试让归属保持明确
