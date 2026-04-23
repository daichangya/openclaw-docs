---
read_when:
    - 重构渠道消息 UI、交互式负载或原生渠道渲染器
    - 更改消息工具能力、投递提示或跨上下文标记
    - 调试 Discord Carbon 导入扇出或渠道插件运行时惰性加载
summary: 将语义化消息呈现与渠道原生 UI 渲染器解耦。
title: 渠道呈现重构计划
x-i18n:
    generated_at: "2026-04-23T20:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98a31cd400599542550d4549e99165704e2393baa484518482226ea05b861316
    source_path: plan/ui-channels.md
    workflow: 15
---

## 状态

已在共享智能体、CLI、插件能力和出站投递表面实现：

- `ReplyPayload.presentation` 承载语义化消息 UI。
- `ReplyPayload.delivery.pin` 承载已发送消息的置顶请求。
- 共享消息动作现在暴露 `presentation`、`delivery` 和 `pin`，而不是 provider 原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心通过插件声明的出站能力来渲染或自动降级 presentation。
- Discord、Slack、Telegram、Mattermost、Microsoft Teams 和 Feishu 渲染器会消费这个通用契约。
- Discord 渠道控制平面代码不再导入基于 Carbon 的 UI 容器。

规范文档现已迁移到 [Message Presentation](/zh-CN/plugins/message-presentation)。  
请将本计划保留为历史实现背景；如果契约、渲染器或回退行为发生变化，请更新规范指南。

## 问题

当前渠道 UI 被拆分在多个互不兼容的表面上：

- 核心通过 `buildCrossContextComponents` 拥有一个具备 Discord 形态的跨上下文渲染器 hook。
- Discord `channel.ts` 可以导入原生 Carbon UI，依赖 `DiscordUiContainer`，这会将运行时 UI 依赖拉入渠道插件控制平面。
- 智能体和 CLI 暴露了原生负载逃生舱口，例如 Discord `components`、Slack `blocks`、Telegram 或 Mattermost `buttons`，以及 Teams 或 Feishu `card`。
- `ReplyPayload.channelData` 同时承载传输提示和原生 UI 信封。
- 通用 `interactive` 模型已存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已使用的更丰富布局要窄。

这使核心感知原生 UI 形状，削弱了插件运行时的惰性加载，并让智能体有太多 provider 特定方式来表达相同的消息意图。

## 目标

- 核心根据声明的能力决定消息的最佳语义化呈现。
- 扩展声明能力，并将语义化呈现渲染为原生传输负载。
- Web Control UI 与聊天原生 UI 保持分离。
- 不通过共享智能体或 CLI 消息表面暴露原生渠道负载。
- 不受支持的呈现功能会自动降级为最佳文本表示。
- 诸如置顶已发送消息之类的投递行为应属于通用投递元数据，而不是呈现。

## 非目标

- 不为 `buildCrossContextComponents` 提供向后兼容 shim。
- 不公开 `components`、`blocks`、`buttons` 或 `card` 这类原生逃生舱口。
- 核心不导入渠道原生 UI 库。
- 不为内置渠道提供 provider 特定 SDK 接缝。

## 目标模型

向 `ReplyPayload` 添加一个由核心拥有的 `presentation` 字段。

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

在迁移期间，`interactive` 会成为 `presentation` 的一个子集：

- `interactive` 文本块映射为 `presentation.blocks[].type = "text"`。
- `interactive` 按钮块映射为 `presentation.blocks[].type = "buttons"`。
- `interactive` 选择块映射为 `presentation.blocks[].type = "select"`。

外部智能体和 CLI schema 现在使用 `presentation`；`interactive` 保留为现有回复生产者所使用的内部旧版解析/渲染辅助工具。

## 投递元数据

为非 UI 的发送行为增加一个由核心拥有的 `delivery` 字段。

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

语义：

- `delivery.pin = true` 表示将第一个成功投递的消息置顶。
- `notify` 默认为 `false`。
- `required` 默认为 `false`；对于不支持的渠道或置顶失败，会自动降级为继续投递。
- 现有消息的手动 `pin`、`unpin` 和 `list-pins` 消息动作继续保留。

当前 Telegram ACP 话题绑定应从 `channelData.telegram.pin = true` 迁移为 `delivery.pin = true`。

## 运行时能力契约

将 presentation 和 delivery 渲染 hook 添加到运行时出站适配器，而不是控制平面渠道插件。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

核心行为：

- 解析目标渠道和运行时适配器。
- 获取 presentation 能力。
- 在渲染前降级不受支持的块。
- 调用 `renderPresentation`。
- 如果不存在渲染器，则将 presentation 转换为文本回退。
- 成功发送后，如果请求了 `delivery.pin` 且渠道支持，则调用 `pinDeliveredMessage`。

## 渠道映射

Discord：

- 在仅运行时模块中，将 `presentation` 渲染为 components v2 和 Carbon 容器。
- 将强调色辅助工具保留在轻量模块中。
- 从渠道插件控制平面代码中移除 `DiscordUiContainer` 导入。

Slack：

- 将 `presentation` 渲染为 Block Kit。
- 移除智能体和 CLI 的 `blocks` 输入。

Telegram：

- 将 text、context 和 divider 渲染为文本。
- 在目标表面已配置且允许时，将 actions 和 select 渲染为内联键盘。
- 当内联按钮被禁用时，使用文本回退。
- 将 ACP 话题置顶迁移到 `delivery.pin`。

Mattermost：

- 在已配置时，将 actions 渲染为交互式按钮。
- 其他块使用文本回退。

Microsoft Teams：

- 将 `presentation` 渲染为 Adaptive Cards。
- 保留手动 pin/unpin/list-pins 动作。
- 如果 Graph 对目标会话的支持足够可靠，可选择实现 `pinDeliveredMessage`。

Feishu：

- 将 `presentation` 渲染为交互式卡片。
- 保留手动 pin/unpin/list-pins 动作。
- 如果 API 行为足够可靠，可选择实现用于已发送消息置顶的 `pinDeliveredMessage`。

LINE：

- 尽可能将 `presentation` 渲染为 Flex 或模板消息。
- 对不支持的块回退为文本。
- 从 `channelData` 中移除 LINE UI 负载。

纯文本或能力有限的渠道：

- 采用保守格式将 presentation 转换为文本。

## 重构步骤

1. 重新应用 Discord 发布修复，将 `ui-colors.ts` 从基于 Carbon 的 UI 中拆分出来，并从 `extensions/discord/src/channel.ts` 中移除 `DiscordUiContainer`。
2. 向 `ReplyPayload`、出站负载标准化、投递摘要和 hook 负载中添加 `presentation` 和 `delivery`。
3. 在一个收窄的 SDK/运行时子路径中添加 `MessagePresentation` schema 和解析辅助工具。
4. 用语义化 presentation 能力替换消息能力中的 `buttons`、`cards`、`components` 和 `blocks`。
5. 为 presentation 渲染和 delivery 置顶添加运行时出站适配器 hook。
6. 用 `buildCrossContextPresentation` 替换跨上下文组件构造。
7. 删除 `src/infra/outbound/channel-adapters.ts`，并从渠道插件类型中移除 `buildCrossContextComponents`。
8. 将 `maybeApplyCrossContextMarker` 改为附加 `presentation`，而不是原生参数。
9. 更新插件分发发送路径，使其只消费语义化 presentation 和投递元数据。
10. 移除智能体和 CLI 的原生负载参数：`components`、`blocks`、`buttons` 和 `card`。
11. 移除创建原生消息工具 schema 的 SDK 辅助工具，并替换为 presentation schema 辅助工具。
12. 从 `channelData` 中移除 UI/原生信封；在逐项审查剩余字段前，只保留传输元数据。
13. 迁移 Discord、Slack、Telegram、Mattermost、Microsoft Teams、Feishu 和 LINE 渲染器。
14. 更新消息 CLI、渠道页面、插件 SDK 和能力扩展手册的文档。
15. 对 Discord 及受影响渠道入口点执行导入扇出分析。

在本次重构中，步骤 1-11 和 13-14 已针对共享智能体、CLI、插件能力和出站适配器契约实现。步骤 12 仍是后续更深入的内部清理工作，用于清理 provider 私有的 `channelData` 传输信封。步骤 15 仍属于后续验证，如果我们希望在类型/测试门禁之外得到量化的导入扇出数据。

## 测试

添加或更新：

- Presentation 标准化测试。
- 对不受支持块的 presentation 自动降级测试。
- 插件分发和核心投递路径中的跨上下文标记测试。
- Discord、Slack、Telegram、Mattermost、Microsoft Teams、Feishu、LINE 以及文本回退的渠道渲染矩阵测试。
- 证明原生字段已移除的消息工具 schema 测试。
- 证明原生标志已移除的 CLI 测试。
- 覆盖 Carbon 的 Discord 入口点导入惰性回归测试。
- 覆盖 Telegram 和通用回退的 delivery 置顶测试。

## 开放问题

- `delivery.pin` 是否应该在第一阶段就为 Discord、Slack、Microsoft Teams 和 Feishu 实现，还是先只做 Telegram？
- `delivery` 将来是否应吸收 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice` 等现有字段，还是继续专注于发送后行为？
- Presentation 是否应该直接支持图像或文件引用，还是暂时让媒体与 UI 布局保持分离？
