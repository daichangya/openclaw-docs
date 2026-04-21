---
read_when:
    - 添加或修改消息卡片、按钮或选择器的渲染
    - 构建支持丰富出站消息的渠道插件
    - 更改消息工具的呈现方式或传递能力
    - 调试提供商特定的卡片 / 区块 / 组件渲染回归问题
summary: 用于渠道插件的语义化消息卡片、按钮、选择器、回退文本和传递提示
title: 消息呈现
x-i18n:
    generated_at: "2026-04-21T20:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# 消息呈现

消息呈现是 OpenClaw 用于丰富出站聊天 UI 的共享契约。
它让智能体、CLI 命令、审批流程和插件只需描述一次消息意图，
同时每个渠道插件都可以尽可能渲染出最合适的原生形态。

将消息呈现用于可移植的消息 UI：

- 文本区块
- 小型上下文 / 页脚文本
- 分隔线
- 按钮
- 选择菜单
- 卡片标题和语气

不要向共享消息工具中添加新的提供商原生字段，例如 Discord 的 `components`、Slack
的 `blocks`、Telegram 的 `buttons`、Teams 的 `card` 或 Feishu 的 `card`。这些字段属于由渠道插件负责的渲染器输出。

## 契约

插件作者从以下位置导入公开契约：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

结构：

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

按钮语义：

- `value` 是应用动作值；当渠道支持可点击控件时，它会通过该渠道现有的交互路径路由回来。
- `url` 是链接按钮。它可以在没有 `value` 的情况下存在。
- `label` 是必填项，也会用于文本回退。
- `style` 是建议性的。渲染器应将不支持的样式映射为安全的默认值，而不是让发送失败。

选择菜单语义：

- `options[].value` 是选中的应用值。
- `placeholder` 是建议性的，在没有原生选择菜单支持的渠道中可能会被忽略。
- 如果某个渠道不支持选择菜单，回退文本会列出这些标签。

## 生产者示例

简单卡片：

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

仅 URL 的链接按钮：

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

选择菜单：

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 发送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

置顶传递：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

带显式 JSON 的置顶传递：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 渲染器契约

渠道插件在其出站适配器上声明渲染支持：

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

能力字段刻意保持为简单的布尔值。它们描述的是渲染器能够让哪些内容变为可交互，而不是原生平台的所有限制。渲染器仍然负责平台特定限制，例如最大按钮数、区块数和卡片大小。

## 核心渲染流程

当 `ReplyPayload` 或消息动作包含 `presentation` 时，核心会：

1. 规范化呈现负载。
2. 解析目标渠道的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器可以渲染该负载时，调用 `renderPresentation`。
5. 当适配器缺失或无法渲染时，回退为保守的文本。
6. 通过正常的渠道传递路径发送结果负载。
7. 在第一条消息成功发送后，应用 `delivery.pin` 等传递元数据。

核心负责回退行为，因此生产者可以保持渠道无关。渠道插件负责原生渲染和交互处理。

## 降级规则

消息呈现必须能够安全地发送到能力受限的渠道。

回退文本包括：

- 第一行中的 `title`
- 作为普通段落的 `text` 区块
- 作为紧凑上下文行的 `context` 区块
- 作为视觉分隔符的 `divider` 区块
- 按钮标签，链接按钮还包括其 URL
- 选择项标签

不受支持的原生控件应降级，而不是让整次发送失败。
示例：

- 当 Telegram 的内联按钮被禁用时，会发送文本回退。
- 没有选择菜单支持的渠道会以文本形式列出选择项。
- 仅 URL 的按钮会变为原生链接按钮，或变为回退 URL 行。
- 可选的置顶失败不会导致已传递的消息失败。

主要例外是 `delivery.pin.required: true`；如果请求将置顶设为必需，而渠道无法置顶已发送消息，则传递会报告失败。

## 提供商映射

当前内置渲染器：

| 渠道 | 原生渲染目标 | 说明 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord | Components 和组件容器 | 为现有提供商原生负载生产者保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。 |
| Slack | Block Kit | 为现有提供商原生负载生产者保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。 |
| Telegram | 文本加内联键盘 | 按钮 / 选择菜单要求目标界面支持内联按钮能力；否则使用文本回退。 |
| Mattermost | 文本加交互式 props | 其他区块会降级为文本。 |
| Microsoft Teams | Adaptive Cards | 当同时提供普通 `message` 文本和卡片时，普通 `message` 文本也会一并包含。 |
| Feishu | 交互式卡片 | 卡片头部可以使用 `title`；正文会避免重复该标题。 |
| 纯文本渠道 | 文本回退 | 没有渲染器的渠道仍然会得到可读的输出。 |

提供商原生负载兼容性是为现有回复生产者提供的过渡性便利。
这并不是向共享层添加新的原生字段的理由。

## Presentation 与 InteractiveReply

`InteractiveReply` 是较早的内部子集，供审批和交互辅助工具使用。它支持：

- 文本
- 按钮
- 选择菜单

`MessagePresentation` 是标准的共享发送契约。它新增了：

- 标题
- 语气
- 上下文
- 分隔线
- 仅 URL 的按钮
- 通过 `ReplyPayload.delivery` 提供的通用传递元数据

桥接旧代码时，请使用 `openclaw/plugin-sdk/interactive-runtime` 中的辅助工具：

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新代码应直接接受或生成 `MessagePresentation`。

## 传递置顶

置顶属于传递行为，不属于消息呈现。请使用 `delivery.pin`，而不要使用 `channelData.telegram.pin` 之类的提供商原生字段。

语义：

- `pin: true` 会置顶第一条成功传递的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选的置顶失败会降级，并保留已发送消息。
- 必需的置顶失败会导致传递失败。
- 分块消息会置顶第一个已传递分块，而不是尾部分块。

手动的 `pin`、`unpin` 和 `pins` 消息动作仍然存在，用于提供商支持这些操作的现有消息。

## 插件作者检查清单

- 当渠道可以渲染或安全降级语义化消息呈现时，在 `describeMessageTool(...)` 中声明 `presentation`。
- 向运行时出站适配器添加 `presentationCapabilities`。
- 在运行时代码中实现 `renderPresentation`，而不是在控制平面插件设置代码中实现。
- 不要将原生 UI 库放入高频的设置 / 目录路径中。
- 在渲染器和测试中保留平台限制。
- 为不受支持的按钮、选择菜单、URL 按钮、标题 / 文本重复，以及混合 `message` 加 `presentation` 发送添加回退测试。
- 仅当提供商可以置顶已发送消息 ID 时，才通过 `deliveryCapabilities.pin` 和 `pinDeliveredMessage` 添加置顶传递支持。
- 不要通过共享消息动作 schema 暴露新的提供商原生卡片 / 区块 / 组件 / 按钮字段。

## 相关文档

- [消息 CLI](/cli/message)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件架构](/zh-CN/plugins/architecture#message-tool-schemas)
- [渠道呈现重构计划](/zh-CN/plan/ui-channels)
