---
read_when:
    - 更改渠道路由或收件箱行为
summary: 各渠道（WhatsApp、Telegram、Discord、Slack）的路由规则和共享上下文
title: 渠道路由
x-i18n:
    generated_at: "2026-04-23T06:40:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1101d9d3411d9e9f48efd14c0dab09d76e83a6bd93c713d38efc01a14c8391
    source_path: channels/channel-routing.md
    workflow: 15
---

# 渠道与路由

OpenClaw 会将回复**发回消息来源的那个渠道**。模型不会选择渠道；路由是确定性的，并由宿主配置控制。

## 关键术语

- **渠道**：`telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`，以及插件渠道。`webchat` 是内部 WebChat UI 渠道，不是可配置的出站渠道。
- **AccountId**：每个渠道的账户实例（在支持时）。
- 可选的渠道默认账户：`channels.<channel>.defaultAccount` 用于选择当出站路径未指定 `accountId` 时应使用哪个账户。
  - 在多账户配置中，当配置了两个或更多账户时，请设置一个显式默认值（`defaultAccount` 或 `accounts.default`）。否则，回退路由可能会选择第一个规范化后的账户 ID。
- **AgentId**：隔离的工作区 + 会话存储（“大脑”）。
- **SessionKey**：用于存储上下文并控制并发的桶键。

## 会话键形状（示例）

默认情况下，私信会收敛到智能体的**主**会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

即使私信会话历史与主会话共享，沙箱和工具策略仍会为外部私信使用派生的、按账户区分的私聊运行时键，这样来自渠道的消息就不会被当作本地主会话运行来处理。

群组和频道在每个渠道内仍保持隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 频道/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord 线程会在基础键后追加 `:thread:<threadId>`。
- Telegram 论坛话题会将 `:topic:<topicId>` 嵌入群组键中。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主私信路由固定

当 `session.dmScope` 为 `main` 时，私信可以共享同一个主会话。
为防止会话的 `lastRoute` 被非所有者私信覆盖，若以下条件全部满足，OpenClaw 会根据 `allowFrom` 推断一个固定所有者：

- `allowFrom` 恰好包含一个非通配符条目。
- 该条目可以规范化为该渠道中的具体发送者 ID。
- 入站私信发送者与该固定所有者不匹配。

在这种不匹配的情况下，OpenClaw 仍会记录入站会话元数据，但会跳过更新主会话的 `lastRoute`。

## 路由规则（如何选择智能体）

路由会为每条入站消息选择**一个智能体**：

1. **精确对等方匹配**（带有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父对等方匹配**（线程继承）。
3. **公会 + 角色匹配**（Discord），通过 `guildId` + `roles`。
4. **公会匹配**（Discord），通过 `guildId`。
5. **团队匹配**（Slack），通过 `teamId`。
6. **账户匹配**（渠道上的 `accountId`）。
7. **渠道匹配**（该渠道上的任意账户，`accountId: "*"`）。
8. **默认智能体**（`agents.list[].default`，否则为列表中的第一项，回退为 `main`）。

当一个绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，**所有已提供字段都必须匹配**，该绑定才会生效。

匹配到的智能体决定使用哪个工作区和会话存储。

## 广播组（运行多个智能体）

广播组让你可以在同一个对等方上运行**多个智能体**，前提是 **OpenClaw 原本会进行回复**（例如：在 WhatsApp 群组中，通过提及/激活门控之后）。

配置：

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

参见：[广播组](/zh-CN/channels/broadcast-groups)。

## 配置概览

- `agents.list`：具名智能体定义（工作区、模型等）。
- `bindings`：将入站渠道/账户/对等方映射到智能体。

示例：

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 会话存储

会话存储位于状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 转录文件与该存储并列保存

你可以通过 `session.store` 和 `{agentId}` 模板覆盖存储路径。

Gateway 网关 和 ACP 会话发现也会扫描默认 `agents/` 根目录下以及模板化 `session.store` 根目录下、由磁盘支持的智能体存储。发现到的存储必须保持在解析后的智能体根目录内，并使用常规的 `sessions.json` 文件。符号链接和根目录外路径会被忽略。

## WebChat 行为

WebChat 会附加到**所选智能体**，并默认使用该智能体的主会话。
因此，WebChat 让你能够在一个地方查看该智能体的跨渠道上下文。

## 回复上下文

入站回复在可用时会包含：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用上下文会作为 `[Replying to ...]` 块追加到 `Body` 中。

这一行为在各渠道之间保持一致。
