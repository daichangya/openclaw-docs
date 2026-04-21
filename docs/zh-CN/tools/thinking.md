---
read_when:
    - 调整思考、快速模式或详细模式的指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 以及推理可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-21T18:02:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# 思考级别（`/think` 指令）

## 功能说明

- 可在任何传入消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超强思考”（最大预算）
  - xhigh → “超强思考+”（GPT-5.2 + Codex 模型和 Anthropic Claude Opus 4.7 effort）
  - adaptive → 提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6 和 Anthropic Claude Opus 4.7 支持）
  - max → 提供商最大推理（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射为 `xhigh`。
  - `highest` 映射为 `high`。
- 提供商说明：
  - 思考菜单和选择器由 provider profile 驱动。提供商插件会为所选模型声明确切可用的级别集合，包括像二元 `on` 这样的标签。
  - `adaptive`、`xhigh` 和 `max` 只会在支持它们的提供商/模型 profile 中显示。对不支持的级别使用类型化指令时会被拒绝，并返回该模型的有效选项。
  - 已存储但不受支持的旧级别会按 provider profile 的等级重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - Anthropic Claude 4.6 模型在未显式设置思考级别时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认启用自适应思考。其 API effort 默认值仍由提供商控制，除非你显式设置思考级别。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也提供 `/think max`；它映射到同一个由提供商控制的最大 effort 路径。
  - OpenAI GPT 模型会根据具体模型对 Responses API effort 的支持情况来映射 `/think`。`/think off` 仅在目标模型支持时发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的负载，而不是发送不受支持的值。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可以避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量内容。
  - Z.AI（`zai/*`）只支持二元 thinking（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅对该条消息生效）。
2. 会话覆盖值（通过发送仅包含指令的消息设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：优先使用提供商声明的默认值；其他被标记为支持推理的目录模型则使用 `low`；否则为 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会固定在当前会话中（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，同时会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内的 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅指令消息会切换会话的快速模式覆盖值，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖值
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射为 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送同样的 `service_tier=priority` 标志。OpenClaw 会在这两种 auth 路径之间共享同一个 `/fast` 开关。
- 对于直接发送到 `api.anthropic.com` 的公开 `anthropic/*` 请求，包括使用 OAuth 认证的流量，快速模式会映射到 Anthropic service tiers：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。
- 当 Anthropic 的显式 `serviceTier` / `service_tier` 模型参数与快速模式默认值同时设置时，前者优先。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic service-tier 注入。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 仅指令消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会更改状态。
- `/verbose off` 会存储为显式会话覆盖值；可在会话 UI 中选择 `inherit` 来清除。
- 内联指令仅影响该条消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 当详细模式开启时，能够发出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息发回，并在可用时使用 `<emoji> <tool-name>: <arg>` 作为前缀（path/command）。这些工具摘要会在每个工具启动时立即发送（单独消息气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀只有在详细模式为 `on` 或 `full` 时才会显示。
- 当详细模式为 `full` 时，工具输出也会在完成后转发出来（单独消息气泡，截断到安全长度）。如果你在运行过程中切换 `/verbose on|full|off`，后续工具消息气泡会遵循新设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅指令消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该条消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件拥有的 trace/debug 行，例如 Active Memory 调试摘要。
- Trace 行可能出现在 `/status` 中，也可能在正常助手回复后作为后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅指令消息会切换是否在回复中显示思考块。
- 启用时，推理内容会作为**单独消息**发送，并以 `Reasoning:` 为前缀。
- `stream`（仅 Telegram）：在生成回复期间将推理流式显示到 Telegram 草稿消息气泡中，随后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖值，然后是每个智能体的默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

## 相关内容

- Elevated mode 文档位于[Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测消息体是已配置的心跳提示词（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会照常生效（但应避免通过心跳更改会话默认值）。
- 心跳传递默认仅发送最终负载。如需同时发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web chat UI

- Web chat 的思考选择器会在页面加载时，从传入的会话存储/config 中同步该会话已保存的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖值；不会等到下次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自当前会话模型的 provider thinking profile。
- 选择器使用 Gateway 网关会话行返回的 `thinkingOptions`。浏览器 UI 不维护自己的提供商正则列表；模型特定级别集合由插件负责。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令与选择器会保持同步。

## provider profile

- 提供商插件可以公开 `resolveThinkingProfile(ctx)` 来定义模型支持的级别和默认值。
- 每个 profile 级别都有一个存储用的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含显示用的 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 已发布的旧版 hook（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留为兼容适配器，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行会公开 `thinkingOptions` 和 `thinkingDefault`，以便 ACP/chat 客户端渲染与运行时验证相同的 profile。
