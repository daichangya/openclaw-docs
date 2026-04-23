---
read_when:
    - 调整 thinking、快速模式或 verbose 指令的解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 和推理可见性的指令语法'
title: Thinking 级别
x-i18n:
    generated_at: "2026-04-23T07:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking 级别（`/think` 指令）

## 它的作用

- 任何传入内容中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2 + Codex 模型和 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应 thinking（Anthropic / Bedrock 上的 Claude 4.6 以及 Anthropic Claude Opus 4.7 支持）
  - max → 提供商最大推理（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都会映射为 `xhigh`。
  - `highest` 会映射为 `high`。
- 提供商说明：
  - Thinking 菜单和选择器由 provider profile 驱动。提供商插件会为所选模型声明确切的级别集，包括诸如二元 `on` 之类的标签。
  - `adaptive`、`xhigh` 和 `max` 仅会为支持它们的 provider/model profiles 进行展示。对于不支持的级别，键入式指令会被拒绝，并显示该模型的有效选项。
  - 已存储但不受支持的现有级别会按 provider profile 排名重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - 当未设置显式 thinking 级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 默认不使用自适应 thinking。除非你显式设置 thinking 级别，否则其 API effort 默认值仍由提供商决定。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为自适应 thinking 加上 `output_config.effort: "xhigh"`，因为 `/think` 是一个 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 还公开了 `/think max`；它会映射到同一个由提供商决定的最大 effort 路径。
  - OpenAI GPT 模型会通过特定于模型的 Responses API effort 支持来映射 `/think`。仅当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理载荷，而不是发送不受支持的值。
  - 通过 Anthropic 兼容流式路径运行的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元 thinking（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅应用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 按智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如果可用，则使用提供商声明的默认值；否则，对其他在目录中标记为支持推理的模型使用 `low`；再否则使用 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会固定应用于当前会话（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，同时会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前 thinking 级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联 / 仅指令的 `/fast on|off`
  2. 会话覆盖
  3. 按智能体的默认值（`agents.list[].fastModeDefault`）
  4. 按模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在支持的 Responses 请求中发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标记。OpenClaw 在这两种凭证路径上共用同一个 `/fast` 开关。
- 对于直接公开的 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 凭证流量，快速模式会映射到 Anthropic service tiers：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。
- 当两者同时设置时，显式的 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic service-tier 注入。
- 只有在启用快速模式时，`/status` 才会显示 `Fast`。

## Verbose 指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话 verbose，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示而不更改状态。
- `/verbose off` 会存储一个显式会话覆盖；可在 Sessions UI 中选择 `inherit` 来清除。
- 内联指令仅影响该消息；否则应用会话 / 全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前 verbose 级别。
- 开启 verbose 后，能发出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息回传，并在可用时以前缀 `<emoji> <tool-name>: <arg>`（路径 / 命令）。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但除非 verbose 为 `on` 或 `full`，否则原始错误详情后缀会被隐藏。
- 当 verbose 为 `full` 时，工具输出也会在完成后转发（单独气泡，并截断到安全长度）。如果你在运行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用会话 / 全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它仅暴露插件拥有的 trace / 调试行，例如 Active Memory 调试摘要。
- Trace 行可显示在 `/status` 中，也可在正常 assistant 回复后作为后续诊断消息显示。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示 thinking blocks。
- 启用后，推理会作为**单独消息**发送，并以前缀 `Reasoning:` 开头。
- `stream`（仅 Telegram）：在生成回复期间，将推理流式写入 Telegram 草稿气泡，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后会话覆盖，然后按智能体默认值（`agents.list[].reasoningDefault`），最后回退（`off`）。

## 相关内容

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文是已配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会像往常一样生效（但应避免通过心跳更改会话默认值）。
- 心跳传递默认仅包含最终载荷。若还要发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或按智能体设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- 页面加载时，web 聊天 thinking 选择器会镜像来自传入会话存储 / 配置的会话已存储级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活动会话模型的 provider thinking profile。
- 选择器使用 Gateway 网关会话行返回的 `thinkingOptions`。浏览器 UI 不会保留自己的 provider regex 列表；特定于模型的级别集由插件负责。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## Provider profiles

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，用于定义模型支持的级别和默认值。
- 每个 profile 级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 已发布的旧版 hooks（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留为兼容性适配器，但新的自定义级别集应使用 `resolveThinkingProfile`。
- Gateway 网关行会暴露 `thinkingOptions` 和 `thinkingDefault`，以便 ACP / 聊天客户端渲染与运行时验证所用的同一 profile。
