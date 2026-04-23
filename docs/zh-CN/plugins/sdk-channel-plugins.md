---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要了解 ChannelPlugin 适配器接口
sidebarTitle: Channel Plugins
summary: 为 OpenClaw 构建消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-23T23:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8829432f3d9671f7ab5a8fec6683e52ae363990aa4c7962dfbdda061d4b1b6c9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

本指南将带你逐步构建一个渠道插件，把 OpenClaw 连接到某个
消息平台。完成后，你将拥有一个可用的渠道，支持私信安全、
配对、回复线程以及出站消息。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包
  结构和 manifest 设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送 / 编辑 / 反应工具。OpenClaw 在核心中保留了一个
共享的 `message` 工具。你的插件负责：

- **配置** — 账户解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程处理** — 如何对回复进行线程化
- **Heartbeat 输入状态** — 针对 heartbeat 投递目标的可选输入 / 忙碌信号

核心负责共享消息工具、提示词接线、外层会话键形状、
通用 `:thread:` 记账以及分发。

如果你的渠道支持在入站回复之外显示“正在输入”指示器，请在渠道插件上暴露
`heartbeat.sendTyping(...)`。核心会在 heartbeat 模型运行开始前，用已解析的
heartbeat 投递目标调用它，并使用共享的输入状态保活 / 清理生命周期。
如果平台需要显式停止信号，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道为消息工具增加了携带媒体来源的参数，请通过
`describeMessageTool(...).mediaSourceParams` 暴露这些参数名。核心会使用这个显式
列表进行沙箱路径规范化以及出站媒体访问策略，因此插件无需为提供商特定的
头像、附件或封面图参数添加共享核心特判。
优先返回按操作键控的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关操作就不会继承其他操作的媒体参数。
对于那些本就有意在所有暴露操作之间共享的参数，扁平数组仍然可用。

如果你的平台在会话 ID 中存储了额外作用域，请将该解析逻辑保留在插件中，使用
`messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射到基础会话 ID、
可选线程 ID、显式 `baseConversationId` 以及任何 `parentConversationCandidates`
的规范钩子。当你返回 `parentConversationCandidates` 时，请按从最窄父级到
最宽 / 基础会话的顺序排列。

对于那些在渠道注册表启动前就需要相同解析逻辑的内置插件，
也可以额外暴露一个顶层 `session-key-api.ts` 文件，并提供匹配的
`resolveSessionConversation(...)` 导出。只有当运行时插件注册表尚不可用时，
核心才会使用这个对引导安全的接口。

当某个插件只需要在通用 / 原始 ID 之上提供父级回退时，
`messaging.resolveParentConversationCandidates(...)` 仍然可用，作为旧版兼容回退。
如果两个钩子都存在，核心会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子
省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 批准与渠道能力

大多数渠道插件不需要特定于批准的代码。

- 核心负责同聊天中的 `/approve`、共享批准按钮负载以及通用回退投递。
- 当渠道需要特定于批准的行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。请将批准投递 / 原生 / 渲染 / auth 相关事实放到 `approvalCapability` 中。
- `plugin.auth` 仅用于 login / logout；核心不再从该对象读取批准 auth 钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准 auth 扩展缝隙。
- 对于同聊天批准 auth 可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 批准，请在其发起界面 / 原生客户端状态与同聊天批准 auth 不同时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心会使用这个特定于 exec 的钩子区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 为常见场景补齐这一点。
- 对于特定于渠道的负载生命周期行为，例如隐藏重复的本地批准提示，或在投递前发送输入状态，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在原生批准路由或抑制回退时使用 `approvalCapability.delivery`。
- 对于由渠道拥有的原生批准事实，请使用 `approvalCapability.nativeRuntime`。在高频渠道入口点上，请通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其懒加载，这样它可以按需导入你的运行时模块，同时仍让核心组装批准生命周期。
- 只有当渠道确实需要自定义批准负载，而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复精确说明启用原生 exec 批准所需的配置旋钮时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账户渠道应渲染账户作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果某个渠道可以从现有配置中推断出稳定的、类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而无需添加特定于批准的核心逻辑。
- 如果某个渠道需要原生批准投递，请让渠道代码专注于目标规范化以及传输 / 展示事实。请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 之后，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及“已路由到别处”通知。`nativeRuntime` 被拆分为几个更小的扩展缝隙：
- `availability` — 账户是否已配置，以及某个请求是否应被处理
- `presentation` — 将共享批准视图模型映射为待处理 / 已解决 / 已过期的原生负载或最终操作
- `transport` — 准备目标，并发送 / 更新 / 删除原生批准消息
- `interactions` — 针对原生按钮或反应的可选 bind / unbind / clear-action 钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要运行时拥有的对象，例如客户端、token、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用的运行时上下文注册表让核心可以基于渠道启动状态引导能力驱动的处理器，而无需增加特定于批准的包装胶水代码。
- 只有当能力驱动的扩展缝隙仍不足以表达需求时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些辅助函数同时传递 `accountId` 和 `approvalKind`。`accountId` 用于让多账户批准策略限定在正确的机器人账户内，`approvalKind` 用于让渠道在没有核心硬编码分支的情况下仍能区分 exec 与插件批准行为。
- 核心现在也负责批准重路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 自行发送“批准已转到私信 / 另一个渠道”的后续消息；相反，应通过共享批准能力辅助函数暴露准确的发起端 + 批准人私信路由信息，并让核心在向发起聊天发送任何通知前聚合实际投递结果。
- 端到端保留已投递批准的 id 类型。原生客户端不应根据渠道本地状态去猜测或改写 exec 与插件批准的路由。
- 不同批准类型可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由能力。
  - Matrix 对 exec 和插件批准保留相同的原生私信 / 渠道路由和反应 UX，同时仍允许按批准类型区分 auth。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装器存在，但新代码应优先使用 capability 构建器，并在插件上暴露 `approvalCapability`。

对于高频渠道入口点，当你只需要这一系列中的某一部分时，请优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样地，当你不需要更宽泛的总接口时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置相关部分：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助函数：
  对导入安全的设置 patch 适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是更窄的、支持环境变量的适配器
  扩展缝隙，用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装的设置
  构建器，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或 auth，并且通用启动 / 配置
流程需要在运行时加载前知道这些环境变量名称，请在插件 manifest 中通过
`channelEnvVars` 声明它们。渠道运行时的 `envVars` 或本地常量
仅应用于面向运维人员的说明文本。

如果你的渠道可能会在插件运行时启动前出现在 `status`、`channels list`、
`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加
`openclaw.setupEntry`。该入口点应当能够安全地在只读命令路径中导入，
并返回这些摘要所需的渠道元数据、设置安全配置适配器、状态适配器以及
渠道密钥目标元数据。不要从设置入口点启动客户端、监听器或传输运行时。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有当你还需要更重的共享设置 / 配置辅助函数时，才使用更宽泛的
  `openclaw/plugin-sdk/setup` 扩展缝隙，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的
适配器 / 向导会在配置写入和最终确认时以失败关闭方式处理，并在验证、完成和文档链接说明中复用同一条“需要安装”的消息。

对于其他高频渠道路径，也请优先使用更窄的辅助函数，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账户配置以及
  默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由 / envelope 以及
  record-and-dispatch 接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析 / 匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  身份 / 发送委托和负载规划
- 来自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`，当出站路由需要保留显式 `replyToId` / `threadId`，或者在基础会话键仍匹配后恢复当前 `:thread:` 会话时使用。如果平台拥有原生线程投递语义，提供商插件可以覆盖优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- `openclaw/plugin-sdk/agent-media-payload`，仅在仍需要旧版智能体 / 媒体
  负载字段布局时使用
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  规范化、重复 / 冲突验证，以及具备稳定回退能力的命令
  配置契约

仅 auth 的渠道通常可以止步于默认路径：核心负责批准，插件只需暴露出站 / auth 能力。像 Matrix、Slack、Telegram 以及自定义聊天传输这类原生批准渠道，应使用共享的原生辅助函数，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 由插件负责的证据收集
- 共享的策略评估

请使用 `openclaw/plugin-sdk/channel-mention-gating` 进行提及策略决策。
只有当你需要更宽泛的入站辅助函数集合时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复给机器人的检测
- 引用机器人的检测
- 线程参与情况检查
- 服务 / 系统消息排除
- 用于证明机器人参与情况的平台原生缓存

适合放在共享辅助函数中的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

推荐流程：

1. 计算本地提及事实。
2. 将这些事实传给 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的入站门控中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件暴露了同一组共享提及辅助函数：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时辅助函数。

旧版 `resolveMentionGating*` 辅助函数仍保留在
`openclaw/plugin-sdk/channel-inbound` 中，但仅作为兼容性导出。
新代码应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包与 manifest">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    决定它是一个渠道插件。有关完整的包元数据接口，
    请参阅 [插件设置与配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有许多可选适配器接口。请从最小集合开始——
    `id` 和 `setup`——然后按需添加适配器。

    创建 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="createChatChannelPlugin 为你完成了什么">
      你无需手动实现底层适配器接口，而是传入声明式选项，
      由构建器负责组合它们：

      | 选项 | 它接线的内容 |
      | --- | --- |
      | `security.dm` | 根据配置字段解析带作用域的私信安全策略 |
      | `pairing.text` | 基于文本代码交换的私信配对流程 |
      | `threading` | reply-to 模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是这些声明式选项。
    </Accordion>

  </Step>

  <Step title="接线入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    请将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们；
    而正常的完整加载仍会接入同一组描述符，用于真实命令注册。
    `registerFull(...)` 仍用于仅运行时工作。
    如果 `registerFull(...)` 注册了 Gateway 网关 RPC 方法，请使用
    插件专属前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）是保留的，并始终
    解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关全部
    选项，请参阅 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加 setup 入口">
    创建 `setup-entry.ts`，用于在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载这个入口，而不是完整入口。
    这样可以避免在设置流程中拉入沉重的运行时代码。
    详情请参阅 [设置与配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar
    模块中的内置工作区渠道，也可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`，特别是当它们还需要一个
    显式的设置时运行时 setter 时。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将其转发给
    OpenClaw。典型模式是使用 webhook 验证请求，并通过你渠道的入站处理器进行分发：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理是渠道特定的。每个渠道插件都拥有
      自己的入站流程。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）以了解真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
编写同目录测试到 `src/channel.test.ts`：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    有关共享测试辅助函数，请参阅 [测试](/zh-CN/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## 高级主题

<CardGroup cols={2}>
  <Card title="线程处理选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账户作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 与动作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助函数" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
某些内置辅助扩展缝隙仍然存在，用于内置插件维护和
兼容性。它们不是构建新渠道插件的推荐模式；
除非你正在直接维护该内置插件家族，否则请优先使用来自通用 SDK
接口的通用 channel / setup / reply / runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件还提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整 manifest schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [智能体 harness 插件](/zh-CN/plugins/sdk-agent-harness)
