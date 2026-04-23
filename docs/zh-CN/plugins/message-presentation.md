---
read_when:
    - 新增或修改消息卡片、按钮或选择器渲染
    - 构建支持丰富出站消息的渠道插件
    - 更改消息工具呈现或投递能力
    - 调试提供商特定的卡片/块/组件渲染回归问题
summary: 用于渠道插件的语义化消息卡片、按钮、选择器、回退文本和投递提示
title: 消息呈现
x-i18n:
    generated_at: "2026-04-23T20:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9052f4c801d6e1fbf4009d34af024dd3b9b0f2af70361833eb8a0abca7383bf9
    source_path: plugins/message-presentation.md
    workflow: 15
---

消息呈现是 OpenClaw 的共享契约，用于丰富的出站聊天 UI。
它让智能体、CLI 命令、批准流程和插件只描述一次消息意图，而每个渠道插件则渲染出其所能提供的最佳原生形态。

请将 presentation 用于可移植的消息 UI：

- 文本区块
- 小型上下文/页脚文本
- 分隔线
- 按钮
- 选择菜单
- 卡片标题和语气

不要向共享消息工具中新增提供商原生字段，例如 Discord 的 `components`、Slack 的 `blocks`、Telegram 的 `buttons`、Teams 的 `card` 或 Feishu 的 `card`。这些都属于由渠道插件负责的渲染器输出。

## 契约

插件作者可从以下位置导入公共契约：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

结构如下：

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

- `value` 是一个应用动作值；当渠道支持可点击控件时，它会通过该渠道现有的交互路径回传。
- `url` 是一个链接按钮。它可以在没有 `value` 的情况下存在。
- `label` 是必需的，并且也会用于文本回退。
- `style` 是建议性的。渲染器应将不支持的样式映射为安全默认值，而不是让发送失败。

选择菜单语义：

- `options[].value` 是被选中的应用值。
- `placeholder` 是建议性的；对于没有原生选择支持的渠道，可忽略它。
- 如果某个渠道不支持选择菜单，回退文本会列出各个标签。

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

仅 URL 链接按钮：

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

固定投递：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

使用显式 JSON 的固定投递：

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

能力字段有意保持为简单布尔值。它们描述的是渲染器能让哪些内容具备交互性，而不是平台原生限制的全部细节。渲染器仍自行负责平台特定限制，例如最大按钮数、最大块数和卡片大小。

## 核心渲染流程

当某个 `ReplyPayload` 或消息动作包含 `presentation` 时，核心会：

1. 规范化 presentation 载荷。
2. 解析目标渠道的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器能够渲染该载荷时，调用 `renderPresentation`。
5. 当适配器缺失或无法渲染时，回退到保守文本。
6. 通过正常的渠道投递路径发送最终载荷。
7. 在第一条消息成功发送后，应用诸如 `delivery.pin` 等投递元数据。

核心负责回退行为，这样生产者就可以保持渠道无关。渠道插件则负责原生渲染和交互处理。

## 降级规则

Presentation 必须能够在能力有限的渠道上安全发送。

回退文本包括：

- `title` 作为第一行
- `text` 块作为普通段落
- `context` 块作为紧凑上下文行
- `divider` 块作为视觉分隔符
- 按钮标签，包括链接按钮的 URL
- 选择菜单的选项标签

不支持的原生控件应降级，而不是导致整次发送失败。
例如：

- 禁用了 inline buttons 的 Telegram 会发送文本回退。
- 不支持选择菜单的渠道会将选项标签列为文本。
- 仅 URL 按钮会变成原生链接按钮，或退化为一行 URL 文本。
- 非必需的 pin 失败不会导致已投递消息失败。

主要例外是 `delivery.pin.required: true`；如果请求了必需 pin，而该渠道无法固定已发送消息，则投递会报告失败。

## 提供商映射

当前内置渲染器：

| 渠道 | 原生渲染目标 | 说明 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord | Components 和 component containers | 为现有 provider 原生载荷生产者保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。 |
| Slack | Block Kit | 为现有 provider 原生载荷生产者保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。 |
| Telegram | 文本加 inline keyboards | 按钮/选择菜单要求目标界面具备 inline button 能力；否则使用文本回退。 |
| Mattermost | 文本加 interactive props | 其他块会降级为文本。 |
| Microsoft Teams | Adaptive Cards | 当同时提供普通 `message` 文本与卡片时，普通文本也会包含在卡片中。 |
| Feishu | 交互式卡片 | 卡片头部可使用 `title`；正文会避免重复该标题。 |
| 纯文本渠道 | 文本回退 | 没有渲染器的渠道仍会得到可读输出。 |

为现有回复生产者保留 provider 原生载荷兼容性是一种过渡措施。它不是向共享字段中新增原生字段的理由。

## Presentation 与 InteractiveReply 的区别

`InteractiveReply` 是较旧的内部子集，由 approval 和交互辅助工具使用。它支持：

- 文本
- 按钮
- 选择菜单

`MessagePresentation` 是规范的共享发送契约。它新增了：

- 标题
- 语气
- 上下文
- 分隔线
- 仅 URL 按钮
- 通过 `ReplyPayload.delivery` 提供通用投递元数据

在桥接旧代码时，请使用 `openclaw/plugin-sdk/interactive-runtime` 中的辅助工具：

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新代码应直接接收或生成 `MessagePresentation`。

## 投递固定（Pin）

固定是一种投递行为，而不是呈现。请使用 `delivery.pin`，而不是
`channelData.telegram.pin` 之类的 provider 原生字段。

语义如下：

- `pin: true` 会固定第一条成功投递的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选 pin 失败会降级处理，并保留已发送消息。
- 必需 pin 失败会导致投递失败。
- 对于分块消息，会固定第一条已投递的块，而不是末尾块。

对于已存在消息，只要 provider 支持相关操作，手动 `pin`、`unpin` 和 `pins` 消息动作仍然存在。

## 插件作者检查清单

- 当某个渠道能够渲染或安全降级语义化呈现时，请从 `describeMessageTool(...)` 中声明 `presentation`。
- 为运行时出站适配器添加 `presentationCapabilities`。
- 在运行时代码中实现 `renderPresentation`，而不是在控制平面插件设置代码中实现。
- 将原生 UI 库保留在热路径设置/目录路径之外。
- 在渲染器和测试中保留平台限制。
- 为不支持的按钮、选择菜单、URL 按钮、标题/文本重复，以及混合 `message` + `presentation` 发送添加回退测试。
- 只有当 provider 能固定已发送 message id 时，才通过 `deliveryCapabilities.pin` 和 `pinDeliveredMessage` 添加 pin 支持。
- 不要通过共享消息动作 schema 暴露新的 provider 原生 card/block/component/button 字段。

## 相关文档

- [消息 CLI](/zh-CN/cli/message)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件架构](/zh-CN/plugins/architecture#message-tool-schemas)
- [渠道呈现重构计划](/zh-CN/plan/ui-channels)
