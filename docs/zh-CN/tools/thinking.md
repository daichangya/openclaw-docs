---
read_when:
    - 调整思考、快速模式或详细模式指令的解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 的指令语法，以及推理可见性'
title: 思考级别
x-i18n:
    generated_at: "2026-04-25T01:07:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## 它的作用

- 在任何入站消息正文中内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7 和 Google Gemini dynamic thinking 支持）
  - max → 提供商最大推理（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 会映射为 `xhigh`。
  - `highest` 会映射为 `high`。
- 提供商说明：
  - Thinking 菜单和选择器由 provider 配置文件驱动。提供商插件会为所选模型声明精确的级别集合，包括诸如二元 `on` 之类的标签。
  - `adaptive`、`xhigh` 和 `max` 仅会为支持它们的 provider/模型配置文件显示。对不支持级别使用的类型化指令会被拒绝，并返回该模型的有效选项。
  - 现有存储的不受支持级别会按 provider 配置文件等级重新映射。`adaptive` 在非自适应模型上会回退为 `medium`，而 `xhigh` 和 `max` 会回退为所选模型支持的最大非 `off` 级别。
  - Anthropic Claude 4.6 模型在未显式设置 thinking level 时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不会默认使用自适应思考。除非你显式设置 thinking level，否则其 API effort 默认值仍由提供商决定。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 还支持 `/think max`；它会映射到相同的 provider 管理的最大 effort 路径。
  - OpenAI GPT 模型会通过模型特定的 Responses API effort 支持来映射 `/think`。仅当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的 reasoning 负载，而不是发送不受支持的值。
  - Google Gemini 会将 `/think adaptive` 映射为 Gemini 由 provider 管理的 dynamic thinking。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射为该模型家族最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可以避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元 thinking（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 仅接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅适用于该条消息）。
2. 会话覆盖（通过发送仅含指令的消息设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如果可用，则使用 provider 声明的默认值；否则，支持推理的模型会解析为 `medium` 或该模型支持的最接近的非 `off` 级别，而不支持推理的模型则保持为 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 这会在当前会话中生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），该命令会被拒绝并给出提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前 thinking level。

## 按智能体应用

- **Embedded Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 在两种认证路径之间保持一个共享的 `/fast` 开关。
- 对于直接公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当显式设置 Anthropic `serviceTier` / `service_tier` 模型参数和快速模式默认值时，前者优先。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过注入 Anthropic 服务层级。
- `/status` 仅在快速模式启用时显示 `Fast`。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最少）| `full` | `off`（默认）。
- 仅含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储一个显式的会话覆盖；可在 Sessions UI 中选择 `inherit` 来清除它。
- 内联指令仅影响该条消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前 verbose 级别。
- 当 verbose 开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为其自己的仅元数据消息发回；如果可用，前缀为 `<emoji> <tool-name>: <arg>`（路径/命令）。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀仅在 verbose 为 `on` 或 `full` 时显示。
- 当 verbose 为 `full` 时，工具输出也会在完成后转发（单独气泡，并截断到安全长度）。如果你在一次运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅含指令的消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该条消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件拥有的 trace/debug 行，例如 Active Memory 调试摘要。
- Trace 行可能出现在 `/status` 中，也可能在普通助手回复之后作为一条后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为**单独消息**发送，并以 `Reasoning:` 为前缀。
- `stream`（仅 Telegram）：在回复生成期间将推理流式显示到 Telegram 草稿气泡中，然后发送不包含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每个智能体默认值（`agents.list[].reasoningDefault`），最后是回退（`off`）。

## 相关

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文是已配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会像平常一样应用（但避免通过心跳更改会话默认值）。
- 心跳传递默认仅发送最终负载。若要同时发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天 thinking 选择器会在页面加载时，从入站会话存储/配置中镜像该会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析出的默认值来自活动会话模型的 provider thinking 配置文件，以及与 `/status` 和 `session_status` 使用的相同回退逻辑。
- 选择器使用 Gateway 网关 会话行/默认值返回的 `thinkingLevels`，而 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不维护自己的 provider 正则列表；模型特定级别集合由插件负责。
- `/think:<level>` 仍然有效，并会更新相同的已存储会话级别，因此聊天指令和选择器会保持同步。

## Provider 配置文件

- 提供商插件可以暴露 `resolveThinkingProfile(ctx)` 来定义模型支持的级别和默认值。
- 每个配置文件级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示 `label`。二元 provider 使用 `{ id: "low", label: "on" }`。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留作为兼容适配器，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关 行/默认值会暴露 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时验证使用的相同配置文件 id 和标签。
