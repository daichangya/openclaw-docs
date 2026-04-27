---
read_when:
    - 重构渠道消息 UI、交互式负载或原生渠道渲染器
    - 更改消息工具能力、投递提示或跨上下文标记
    - 调试 Discord Carbon 导入扇出或渠道插件运行时惰性加载
summary: 将语义消息呈现与渠道原生 UI 渲染器解耦。
title: 渠道呈现重构计划
x-i18n:
    generated_at: "2026-04-27T06:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 15
---

## Status

已为共享智能体、CLI、插件能力和出站投递表面完成实现：

- `ReplyPayload.presentation` 承载语义消息 UI。
- `ReplyPayload.delivery.pin` 承载已发送消息的置顶请求。
- 共享消息操作暴露 `presentation`、`delivery` 和 `pin`，而不是提供商原生的 `components`、`blocks`、`buttons` 或 `card`。
- Core 通过插件声明的出站能力来渲染或自动降级 presentation。
- Discord、Slack、Telegram、Mattermost、MS Teams 和 Feishu 渲染器会消费这一通用契约。
- Discord 渠道控制平面代码不再导入由 Carbon 支持的 UI 容器。

规范文档现位于 [消息呈现](/zh-CN/plugins/message-presentation)。
请将此计划保留为历史实现背景；如契约、渲染器或回退行为发生变化，请更新规范指南。

## Problem

渠道 UI 当前分散在多个彼此不兼容的表面中：

- Core 通过 `buildCrossContextComponents` 拥有一个具备 Discord 形态的跨上下文渲染器钩子。
- Discord `channel.ts` 可以导入原生 Carbon UI（通过 `DiscordUiContainer`），这会将运行时 UI 依赖拉入渠道插件控制平面。
- 智能体和 CLI 暴露了原生负载逃生口，例如 Discord 的 `components`、Slack 的 `blocks`、Telegram 或 Mattermost 的 `buttons`，以及 Teams 或 Feishu 的 `card`。
- `ReplyPayload.channelData` 同时承载传输提示和原生 UI 信封。
- 通用 `interactive` 模型已经存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已经使用的更丰富布局更窄。

这使得 Core 需要感知原生 UI 形状，削弱了插件运行时的惰性加载，并让智能体拥有过多提供商特定的方式来表达相同的消息意图。

## Goals

- Core 根据声明的能力决定消息的最佳语义呈现方式。
- 扩展声明能力，并将语义呈现渲染为原生传输负载。
- Web 控制 UI 与聊天原生 UI 保持分离。
- 原生渠道负载不通过共享智能体或 CLI 消息表面暴露。
- 不受支持的呈现特性会自动降级为最佳文本表示。
- 诸如置顶已发送消息之类的投递行为属于通用投递元数据，而不是呈现。

## Non goals

- 不为 `buildCrossContextComponents` 提供向后兼容垫片。
- 不为 `components`、`blocks`、`buttons` 或 `card` 提供公共原生逃生口。
- Core 不导入渠道原生 UI 库。
- 不为内置渠道提供提供商特定的 SDK 接缝。

## Target model

向 `ReplyPayload` 添加一个由 Core 拥有的 `presentation` 字段。

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

- `interactive` 文本块映射到 `presentation.blocks[].type = "text"`。
- `interactive` 按钮块映射到 `presentation.blocks[].type = "buttons"`。
- `interactive` 选择块映射到 `presentation.blocks[].type = "select"`。

外部智能体和 CLI schema 现在使用 `presentation`；`interactive` 仍保留为内部遗留解析/渲染辅助，以支持现有 reply 生产者。

## Delivery metadata

为不属于 UI 的发送行为添加一个由 Core 拥有的 `delivery` 字段。

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

- `delivery.pin = true` 表示置顶第一条成功投递的消息。
- `notify` 默认值为 `false`。
- `required` 默认值为 `false`；不支持的渠道或置顶失败时会自动降级，继续完成投递。
- 手动 `pin`、`unpin` 和 `list-pins` 消息操作仍保留，用于现有消息。

当前 Telegram ACP 主题绑定应从 `channelData.telegram.pin = true` 迁移到 `delivery.pin = true`。

## Runtime capability contract

将 presentation 和 delivery 渲染钩子添加到运行时出站适配器，而不是控制平面渠道插件中。

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

Core 行为：

- 解析目标渠道和运行时适配器。
- 查询 presentation 能力。
- 在渲染前降级不受支持的块。
- 调用 `renderPresentation`。
- 如果不存在渲染器，则将 presentation 转换为文本回退。
- 成功发送后，当请求 `delivery.pin` 且渠道支持时，调用 `pinDeliveredMessage`。

## Channel mapping

Discord：

- 在仅运行时模块中将 `presentation` 渲染为 components v2 和 Carbon 容器。
- 将强调色辅助函数保留在轻量模块中。
- 从渠道插件控制平面代码中移除 `DiscordUiContainer` 导入。

Slack：

- 将 `presentation` 渲染为 Block Kit。
- 移除智能体和 CLI 的 `blocks` 输入。

Telegram：

- 将 text、context 和 divider 渲染为文本。
- 在配置允许且目标表面支持时，将 actions 和 select 渲染为内联键盘。
- 当内联按钮被禁用时使用文本回退。
- 将 ACP 主题置顶迁移到 `delivery.pin`。

Mattermost：

- 在配置允许时将 actions 渲染为交互按钮。
- 其他块渲染为文本回退。

MS Teams：

- 将 `presentation` 渲染为 Adaptive Cards。
- 保留手动 pin/unpin/list-pins 操作。
- 如果目标会话的 Graph 支持可靠，可选择实现 `pinDeliveredMessage`。

Feishu：

- 将 `presentation` 渲染为交互式卡片。
- 保留手动 pin/unpin/list-pins 操作。
- 如果 API 行为可靠，可选择为已发送消息置顶实现 `pinDeliveredMessage`。

LINE：

- 尽可能将 `presentation` 渲染为 Flex 或模板消息。
- 对不支持的块回退为文本。
- 从 `channelData` 中移除 LINE UI 负载。

纯文本或能力有限的渠道：

- 使用保守格式将 presentation 转换为文本。

## Refactor steps

1. 重新应用 Discord 发布修复，将 `ui-colors.ts` 从由 Carbon 支持的 UI 中拆分出来，并从 `extensions/discord/src/channel.ts` 中移除 `DiscordUiContainer`。
2. 将 `presentation` 和 `delivery` 添加到 `ReplyPayload`、出站负载规范化、投递摘要和钩子负载中。
3. 在一个收窄的 SDK/运行时子路径中添加 `MessagePresentation` schema 和解析辅助函数。
4. 用语义 presentation 能力替换消息能力中的 `buttons`、`cards`、`components` 和 `blocks`。
5. 为 presentation 渲染和 delivery 置顶添加运行时出站适配器钩子。
6. 用 `buildCrossContextPresentation` 替换跨上下文组件构造。
7. 删除 `src/infra/outbound/channel-adapters.ts`，并从渠道插件类型中移除 `buildCrossContextComponents`。
8. 修改 `maybeApplyCrossContextMarker`，使其附加 `presentation` 而非原生参数。
9. 更新插件分发发送路径，使其仅消费语义 presentation 和 delivery 元数据。
10. 移除智能体和 CLI 的原生负载参数：`components`、`blocks`、`buttons` 和 `card`。
11. 移除用于创建原生消息工具 schema 的 SDK 辅助函数，改为使用 presentation schema 辅助函数。
12. 从 `channelData` 中移除 UI/原生信封；在审查完每个剩余字段之前，仅保留传输元数据。
13. 迁移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 和 LINE 渲染器。
14. 更新消息 CLI、渠道页面、插件 SDK 和能力扩展手册文档。
15. 对 Discord 和受影响的渠道入口点运行导入扇出分析。

在此次重构中，步骤 1-11 和 13-14 已针对共享智能体、CLI、插件能力和出站适配器契约实现。步骤 12 仍是针对提供商私有 `channelData` 传输信封的更深入内部清理工作。步骤 15 仍作为后续验证，前提是我们希望获得超出类型/测试门禁之外的量化导入扇出数据。

## Tests

添加或更新：

- Presentation 规范化测试。
- 针对不受支持块的 presentation 自动降级测试。
- 面向插件分发和 Core 投递路径的跨上下文标记测试。
- 针对 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 和文本回退的渠道渲染矩阵测试。
- 证明原生字段已移除的消息工具 schema 测试。
- 证明原生标志已移除的 CLI 测试。
- 针对 Carbon 的 Discord 入口点导入惰性回归测试。
- 涵盖 Telegram 和通用回退的 delivery 置顶测试。

## Open questions

- 第一阶段是否应为 Discord、Slack、MS Teams 和 Feishu 实现 `delivery.pin`，还是仅先支持 Telegram？
- `delivery` 最终是否应吸收现有字段，例如 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice`，还是继续聚焦于发送后行为？
- Presentation 是否应直接支持图片或文件引用，还是媒体暂时仍与 UI 布局分离？

## Related

- [渠道概览](/zh-CN/channels)
- [消息呈现](/zh-CN/plugins/message-presentation)
