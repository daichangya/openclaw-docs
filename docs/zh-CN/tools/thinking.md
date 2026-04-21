---
read_when:
    - 调整思考、快速模式或详细模式的指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 的指令语法，以及推理可见性'
title: 思考级别
x-i18n:
    generated_at: "2026-04-21T06:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: edee9420e1cc3eccfa18d87061c4a4d6873e70cb51fff85305fafbcd6a5d6a7d
    source_path: tools/thinking.md
    workflow: 15
---

# 思考级别（`/think` 指令）

## 它的作用

- 任何传入消息正文中都可以使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超级思考”（最大预算）
  - xhigh → “超级思考+”（GPT-5.2 + Codex 模型以及 Anthropic Claude Opus 4.7 努力度）
  - adaptive → 由提供商管理的自适应思考（适用于 Anthropic/Bedrock 上的 Claude 4.6 和 Anthropic Claude Opus 4.7）
  - max → 提供商最大推理（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射为 `xhigh`。
  - `highest` 映射为 `high`。
- 提供商说明：
  - 只有在提供商/模型声明支持自适应思考时，`adaptive` 才会在原生命令菜单和选择器中显示。为兼容现有配置和别名，它仍然接受手动输入的指令。
  - 只有在提供商/模型声明支持最大思考时，`max` 才会在原生命令菜单和选择器中显示。当模型不支持 `max` 时，现有已保存的 `max` 设置会重映射为所选模型支持的最高级别。
  - 如果没有显式设置思考级别，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 默认不使用自适应思考。它的 API 努力度默认值仍由提供商决定，除非你显式设置思考级别。
  - 对于 Anthropic Claude Opus 4.7，`/think xhigh` 会映射为自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的努力度设置。
  - Anthropic Claude Opus 4.7 还支持 `/think max`；它会映射到同一条由提供商管理的最大努力度路径。
  - OpenAI GPT 模型会根据各模型对 Responses API 努力度的支持情况来映射 `/think`。只有当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的载荷，而不是发送不受支持的值。
  - 在 Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这样可以避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支持二元思考模式（`on`/`off`）。任何非 `off` 级别都视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅对该条消息生效）。
2. 会话覆盖项（通过发送只包含指令的消息设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退值：Anthropic Claude 4.6 模型为 `adaptive`，Anthropic Claude Opus 4.7 在未显式配置时为 `off`，其他支持推理的模型为 `low`，否则为 `off`。

## 设置会话默认值

- 发送一条**只包含该指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会固定在当前会话中（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，同时不会更改会话状态。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内的 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 只含指令的消息会切换会话快速模式覆盖项，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/只含指令的 `/fast on|off`
  2. 会话覆盖项
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退值：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射为 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 在这两种认证路径之间共用同一个 `/fast` 开关。
- 对于直接发送到公共 `anthropic/*` 的请求，包括发往 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当同时设置了显式 Anthropic `serviceTier` / `service_tier` 模型参数和快速模式默认值时，前者会覆盖后者。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 只含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，且不会更改状态。
- `/verbose off` 会存储一个显式的会话覆盖项；可在 Sessions UI 中选择 `inherit` 来清除它。
- 内联指令仅对当前消息生效；否则使用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 当详细模式开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为独立的仅元数据消息发回；如果可用，则前缀为 `<emoji> <tool-name>: <arg>`（路径/命令）。这些工具摘要会在每个工具启动时立即发送（独立气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀只有在详细模式为 `on` 或 `full` 时才会显示。
- 当详细级别为 `full` 时，工具输出也会在完成后转发（独立气泡，并截断到安全长度）。如果你在运行过程中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件跟踪指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 只含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅对该条消息生效；否则使用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件自有的跟踪/调试行，例如 Active Memory 调试摘要。
- 跟踪行可能出现在 `/status` 中，也可能作为普通助手回复后的跟进诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 只含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为**单独一条消息**发送，并带有前缀 `Reasoning:`。
- `stream`（仅 Telegram）：在生成回复时将推理流式写入 Telegram 草稿气泡，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后会话覆盖项，然后每个智能体的默认值（`agents.list[].reasoningDefault`），最后是回退值（`off`）。

## 相关内容

- 提权模式文档见 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测消息正文是已配置的心跳提示词（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令照常生效（但应避免通过心跳更改会话默认值）。
- 心跳投递默认只发送最终载荷。如需同时发送单独的 `Reasoning:` 消息（如有），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体级别的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天中的思考选择器会在页面加载时，镜像会话从传入会话存储/config 中保存的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖项；它不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析出的默认值来自当前会话模型：Anthropic 上的 Claude 4.6 为 `adaptive`，Anthropic Claude Opus 4.7 在未配置时为 `off`，其他支持推理的模型为 `low`，否则为 `off`。
- 该选择器会保持提供商感知：
  - 大多数提供商显示 `off | minimal | low | medium | high`
  - Anthropic/Bedrock Claude 4.6 显示 `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 显示 `off | minimal | low | medium | high | xhigh | adaptive | max`
  - Z.AI 显示二元 `off | on`
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。
