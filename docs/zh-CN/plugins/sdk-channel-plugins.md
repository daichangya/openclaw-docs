---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到某个消息平台
    - 你需要了解 ChannelPlugin 适配器界面
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件＿日本 to=final code  omitted
x-i18n:
    generated_at: "2026-04-23T20:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a596b0ec6c632ca1e7f760956087d325b5599c1fb70b9510f713afc95284de62
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

本指南将带你一步步构建一个渠道插件，把 OpenClaw 连接到某个
消息平台。完成后，你将拥有一个可工作的渠道，具备私信安全、
配对、回复线程和出站消息能力。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包
  结构和 manifest 设置。
</Info>

## 渠道插件如何工作

渠道插件不需要拥有自己的发送/编辑/表情回应工具。OpenClaw 在核心中保留了一个
共享的 `message` 工具。你的插件负责：

- **配置** —— 账户解析和设置向导
- **安全** —— 私信策略和允许列表
- **配对** —— 私信审批流程
- **会话语法** —— 提供商特定会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** —— 向平台发送文本、媒体和投票
- **线程处理** —— 回复如何在线程中组织
- **心跳输入中** —— 用于心跳投递目标的可选输入中/忙碌信号

核心负责共享 message 工具、提示词接线、外层会话键形状、
通用 `:thread:` 记账以及分发。

如果你的渠道支持在入站回复之外显示输入中指示器，
请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用已解析的心跳投递目标调用它，并使用共享的输入中保活/清理生命周期。如果平台需要显式停止信号，请再添加 `heartbeat.clearTyping(...)`。

如果你的渠道为 message 工具添加了携带媒体来源的参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名。核心会使用这个显式列表来处理沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定头像、附件或封面图参数添加共享核心特例。
更推荐返回按 action 分类的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样不相关的 action 不会继承另一个 action 的媒体参数。对于那些本就有意在每个暴露 action 间共享的参数，平面数组仍然可用。

如果你的平台在会话 id 中存储了额外范围，请把这部分解析逻辑保留在插件中，并使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射到基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按照从最窄父级到最宽/基础会话的顺序排列。

需要在渠道注册表启动前使用相同解析逻辑的内置插件，
还可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的
`resolveSessionConversation(...)`。仅当运行时插件注册表尚不可用时，核心才会使用这个可安全 bootstrap 的界面。

当某个插件只需要在通用/raw id 之上添加父级回退时，
`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退使用。如果两个钩子都存在，核心会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子未返回它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 审批与渠道能力

大多数渠道插件不需要审批专用代码。

- 核心负责同聊天中的 `/approve`、共享审批按钮载荷以及通用回退投递。
- 当渠道需要审批专用行为时，优先在渠道插件上使用单个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已被移除。请将审批投递/原生/渲染/认证事实放到 `approvalCapability` 上。
- `plugin.auth` 仅用于 login/logout；核心不再从该对象中读取审批认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批认证接缝。
- 对于同聊天审批认证可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 审批，当发起界面/原生客户端状态与同聊天审批认证不同时，请使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用这个 exec 专用钩子来区分 `enabled` 与 `disabled`、判断发起渠道是否支持原生 exec 审批，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 可为常见情况补全此部分。
- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 处理渠道特定的载荷生命周期行为，例如隐藏重复的本地审批提示或在投递前发送输入中指示器。
- 仅在需要原生审批路由或回退抑制时使用 `approvalCapability.delivery`。
- 当审批事实归渠道运行时所有时，请使用 `approvalCapability.nativeRuntime`。对于高频渠道入口点，可通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持惰性，它可以按需导入你的运行时模块，同时仍让核心组装审批生命周期。
- 仅当某个渠道确实需要自定义审批载荷而不能使用共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望在禁用路径回复中解释启用原生 exec 审批所需的确切配置项时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；命名账户渠道应渲染账户范围路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果某个渠道可以从现有配置中推断出稳定的类所有者私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而无需添加审批专用核心逻辑。
- 如果某个渠道需要原生审批投递，请让渠道代码专注于目标规范化加上传输/展示事实。请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就能组装处理器，并接管请求过滤、路由、去重、过期、gateway 订阅以及“已路由到其他地方”的通知。`nativeRuntime` 被拆分为几个更小的接缝：
- `availability` —— 账户是否已配置，以及请求是否应被处理
- `presentation` —— 将共享审批视图模型映射为待处理/已解决/已过期的原生载荷或最终动作
- `transport` —— 准备目标并发送/更新/删除原生审批消息
- `interactions` —— 原生按钮或表情回应的可选 bind/unbind/clear-action 钩子
- `observe` —— 可选的投递诊断钩子
- 如果渠道需要运行时自有对象，例如 client、token、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心可以根据渠道启动状态引导能力驱动的处理器，而不必添加审批专用包装胶水代码。
- 仅当能力驱动接缝尚不足以表达需求时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助器同时路由 `accountId` 和 `approvalKind`。`accountId` 可让多账户审批策略限定在正确的机器人账户上，而 `approvalKind` 则可让渠道在无需核心硬编码分支的前提下区分 exec 与插件审批行为。
- 核心现在也负责审批重路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送自己的“审批已转到私信 / 另一个渠道”后续消息；应改为通过共享审批能力辅助器暴露准确的 origin + 审批人私信路由，然后让核心在向发起聊天回发通知前聚合实际投递结果。
- 请在端到端流程中保留已投递审批 id 的类型。原生客户端不应
  根据渠道本地状态猜测或重写 exec 与插件审批路由。
- 不同审批类型可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 为 exec 和插件 id 都保留原生审批路由。
  - Matrix 对 exec 和插件审批保留相同的原生私信/渠道路由与表情回应 UX，同时仍允许按审批类型区分认证。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装器存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于高频渠道入口点，当你只需要这一组中的某一部分时，请优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样地，当你不需要更宽泛的总括界面时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置，尤其如此：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助器：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用于 `createEnvPatchedAccountSetupAdapter` 的窄环境感知适配器
  接缝
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  构建器以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或认证，并且通用启动/配置
流程应在运行时加载前就知道这些环境变量名，请在插件 manifest 中通过 `channelEnvVars` 声明它们。把渠道运行时 `envVars` 或本地常量仅用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前就出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应可在只读命令路径中安全导入，并返回这些摘要所需的渠道元数据、设置安全配置适配器、状态适配器以及渠道密钥目标元数据。不要从 setup entry 启动 client、listener 或传输运行时。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有当你还需要更重的共享设置/配置辅助器时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接缝，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“先安装这个插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的
adapter/wizard 会在配置写入和最终完成上以关闭失败方式处理，并在验证、finalize 和文档链接文案中复用相同的“需要安装”消息。

对于其他高频渠道路径，请优先使用窄辅助器，而不是更宽泛的旧版界面：

- 使用 `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers` 处理多账户配置与
  默认账户回退
- 使用 `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch` 处理入站路由/envelope 以及
  记录与分发接线
- 使用 `openclaw/plugin-sdk/messaging-targets` 处理目标解析/匹配
- 使用 `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime` 处理媒体加载以及出站
  身份/发送委托和载荷规划
- 当某个出站路由需要保留显式 `replyToId`/`threadId`，或在基础会话键仍然匹配后恢复当前 `:thread:` 会话时，请使用
  `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。
  当其平台具有原生线程投递语义时，provider 插件可以覆盖优先级、后缀行为和线程 id 规范化。
- 使用 `openclaw/plugin-sdk/thread-bindings-runtime` 处理线程绑定生命周期
  和 adapter 注册
- 仅当仍需要旧版智能体/媒体
  载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- 对于 Telegram 自定义命令规范化、重复/冲突校验以及稳定回退的命令
  配置契约，请使用 `openclaw/plugin-sdk/telegram-command-config`

仅认证渠道通常可以停留在默认路径：核心会处理审批，而插件只需暴露出站/认证能力。像 Matrix、Slack、Telegram 以及自定义聊天传输这类原生审批渠道，应使用共享的原生辅助器，而不是自行实现审批生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 插件自有的证据收集
- 共享的策略评估

请使用 `openclaw/plugin-sdk/channel-mention-gating` 处理提及策略决策。
只有当你需要更广泛的入站
辅助器 barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复机器人检测
- 引用机器人检测
- 线程参与检查
- 服务/系统消息排除
- 用于证明机器人参与的平台原生缓存

适合放在共享辅助器中的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

推荐流程：

1. 计算本地提及事实。
2. 将这些事实传入 `resolveInboundMentionDecision({ facts, policy })`。
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

`api.runtime.channel.mentions` 为
已经依赖运行时注入的内置渠道插件暴露了相同的共享提及辅助器：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时辅助器。

旧版 `resolveMentionGating*` 辅助器仍保留在
`openclaw/plugin-sdk/channel-inbound` 中，但仅作为兼容导出。新代码
应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 逐步讲解

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包与 manifest">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    就是让它成为渠道插件的关键。完整的包元数据界面，
    请参见 [Plugin Setup and Config](/zh-CN/plugins/sdk-setup#openclaw-channel)：

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
    `ChannelPlugin` 接口包含许多可选 adapter 界面。先从
    最小集合开始 —— `id` 和 `setup` —— 然后根据需要添加 adapter。

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

    <Accordion title="createChatChannelPlugin 为你做了什么">
      你无需手动实现底层 adapter 接口，而是传入声明式选项，
      由构建器进行组合：

      | 选项 | 它会接线什么 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域化私信安全解析器 |
      | `pairing.text` | 基于文本代码交换的私信配对流程 |
      | `threading` | reply-to 模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始 adapter 对象，
      而不是这些声明式选项。
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

    请将渠道自有 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们；
    而正常完整加载仍会为真实命令
    注册拾取相同描述符。`registerFull(...)` 则保留给纯运行时工作。
    如果 `registerFull(...)` 注册了 gateway RPC 方法，请使用
    插件专用前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终
    解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关所有
    选项，请参见 [Entry Points](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加 setup entry">
    创建 `setup-entry.ts`，以便在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用
    或尚未配置时，OpenClaw 会加载它，而不是完整入口。
    这可以避免在设置流程中拉入重量级运行时代码。
    详情请参见 [Setup and Config](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到侧车
    模块中的内置工作区渠道，可使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`，
    当它们还需要一个
    显式的设置时运行时 setter 时尤其如此。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将其转发到
    OpenClaw。典型模式是一个验证请求并通过你的渠道入站处理器进行
    分发的 webhook：

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
      自己的入站流水线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）中的真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
在 `src/channel.test.ts` 中编写同目录测试：

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

    共享测试辅助器请参见 [测试](/zh-CN/plugins/sdk-testing)。

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
  <Card title="线程选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账户作用域或自定义回复模式
  </Card>
  <Card title="Message 工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和 action 发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助器" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
某些内置辅助器接缝仍然存在，用于内置插件维护和
兼容性。它们并不是新渠道插件的推荐模式；
除非你正在直接维护该内置插件家族，否则请优先使用通用 SDK
界面中的通用 channel/setup/reply/runtime 子路径。
</Note>

## 下一步

- [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins) —— 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) —— 测试工具和契约测试
- [Plugin Manifest](/zh-CN/plugins/manifest) —— 完整 manifest schema
