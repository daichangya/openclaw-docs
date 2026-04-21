---
read_when:
    - 调整思考、快速模式或详细模式的指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 以及推理可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-21T04:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c41d7bd19bf1dc25ba9e6bc2d706a2963e8466eeaa1c62fd01ac782ad1fc99f0
    source_path: tools/thinking.md
    workflow: 15
---

# 思考级别（`/think` 指令）

## 作用

- 可在任何传入消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超深度思考” （最大预算）
  - xhigh → “超深度思考+” （GPT-5.2 + Codex 模型以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应思考（Anthropic Claude 4.6 和 Opus 4.7 支持）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射为 `xhigh`。
  - `highest`、`max` 都映射为 `high`。
- 提供商说明：
  - 当未显式设置思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认启用自适应思考。除非你显式设置思考级别，否则其 API 的默认 effort 仍由提供商决定。
  - 对于 Anthropic Claude Opus 4.7，`/think xhigh` 会映射为自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是一个思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - OpenAI GPT 模型会根据各模型对 Responses API effort 的支持情况来映射 `/think`。`/think off` 仅在目标模型支持时发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略该禁用推理载荷，而不是发送不受支持的值。
  - 在兼容 Anthropic 的流式路径上，MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这可避免 MiniMax 的非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元思考（`on`/`off`）。任何非 `off` 的级别都会被视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）将 `/think off` 映射为 `thinking: { type: "disabled" }`，将任何非 `off` 的级别映射为 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅对该条消息生效）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退值：Anthropic Claude 4.6 模型为 `adaptive`，Anthropic Claude Opus 4.7 在未显式配置时为 `off`，其他支持推理的模型为 `low`，否则为 `off`。

## 设置会话默认值

- 发送一条**只包含该指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会在当前会话中保持生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 系统会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝，并给出提示，同时会话状态保持不变。
- 发送 `/think`（或 `/think:`）且不带参数，可查看当前思考级别。

## 按智能体应用

- **Embedded Pi**：解析后的级别会传递给进程内的 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送 `/fast`（或 `/fast status`）且不带模式，可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联 / 仅指令 `/fast on|off`
  2. 会话覆盖
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退值：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射为 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标记。OpenClaw 在这两条鉴权路径之间共用同一个 `/fast` 开关。
- 对于直接发送到 `anthropic/*` 的公开 Anthropic 请求，包括发送到 `api.anthropic.com` 的 OAuth 鉴权流量，快速模式会映射为 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于兼容 Anthropic 路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当显式设置 Anthropic `serviceTier` / `service_tier` 模型参数时，如果两者同时存在，它会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会更改状态。
- `/verbose off` 会存储一个显式的会话覆盖；可在会话 UI 中选择 `inherit` 来清除。
- 内联指令仅对该条消息生效；否则使用会话 / 全局默认值。
- 发送 `/verbose`（或 `/verbose:`）且不带参数，可查看当前详细级别。
- 当详细模式开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为独立的仅元数据消息发回，并在可用时使用 `<emoji> <tool-name>: <arg>` 作为前缀（路径 / 命令）。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 在普通模式下，工具失败摘要仍然可见，但原始错误详情后缀会被隐藏，除非详细模式为 `on` 或 `full`。
- 当详细模式为 `full` 时，工具输出也会在完成后转发（单独气泡，截断到安全长度）。如果你在某次运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件跟踪指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅对该条消息生效；否则使用会话 / 全局默认值。
- 发送 `/trace`（或 `/trace:`）且不带参数，可查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只暴露插件拥有的 trace/debug 行，例如 Active Memory 调试摘要。
- 跟踪行可能出现在 `/status` 中，也可能作为普通助手回复后的后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为一条**单独消息**发送，并带有 `Reasoning:` 前缀。
- `stream`（仅 Telegram）：会在回复生成期间将推理流式写入 Telegram 草稿气泡，然后发送不含推理的最终回答。
- 别名：`/reason`。
- 发送 `/reasoning`（或 `/reasoning:`）且不带参数，可查看当前推理级别。
- 解析顺序：内联指令、会话覆盖、每个智能体默认值（`agents.list[].reasoningDefault`），然后是回退值（`off`）。

## 相关内容

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文为已配置的心跳提示词（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会像往常一样生效（但应避免通过心跳更改会话默认值）。
- 心跳投递默认仅发送最终载荷。若还要发送单独的 `Reasoning:` 消息（如可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天中的思考选择器会在页面加载时，从传入会话存储 / 配置中同步该会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自当前会话模型：Anthropic 上的 Claude 4.6 为 `adaptive`，Anthropic Claude Opus 4.7 在未配置时为 `off`，其他支持推理的模型为 `low`，否则为 `off`。
- 选择器会保持提供商感知：
  - 大多数提供商显示 `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 显示 `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI 显示二元选项 `off | on`
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。
