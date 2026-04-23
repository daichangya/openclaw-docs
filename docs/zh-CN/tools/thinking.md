---
read_when:
    - 调整 thinking、快速模式或详细输出指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 和 reasoning 可见性的指令语法'
title: Thinking 级别
x-i18n:
    generated_at: "2026-04-23T23:05:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b135784cb3696309f518090c4db859a2e1834cdc4dd3360bdfae2ba87604f0
    source_path: tools/thinking.md
    workflow: 15
---

## 作用

- 任意入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2 + Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应 thinking（Anthropic/Bedrock 上的 Claude 4.6 和 Anthropic Claude Opus 4.7 支持）
  - max → 提供商最大 reasoning（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - Thinking 菜单和选择器由提供商配置文件驱动。提供商插件会为所选模型声明精确的级别集合，包括如二元 `on` 这样的标签。
  - `adaptive`、`xhigh` 和 `max` 仅会对支持它们的提供商/模型配置文件显示。对于不支持级别的手动输入指令，会以该模型的有效选项拒绝。
  - 已存储的、当前不受支持的级别会按提供商配置文件等级重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 off 级别。
  - Anthropic Claude 4.6 模型在未显式设置 thinking 级别时，默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用自适应 thinking。其 API effort 默认值仍由提供商控制，除非你显式设置了 thinking 级别。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为自适应 thinking 加 `output_config.effort: "xhigh"`，因为 `/think` 是一个 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 还支持 `/think max`；它会映射到相同的提供商控制的最大 effort 路径。
  - OpenAI GPT 模型会根据模型特定的 Responses API effort 支持来映射 `/think`。仅当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用 reasoning 的载荷，而不是发送不受支持的值。
  - Anthropic 兼容流式传输路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可避免 MiniMax 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元 thinking（`on`/`off`）。任何非 `off` 级别都会视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 仅接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值标准化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅对该条消息生效）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 按智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：若有可用，则使用提供商声明的默认值；否则，支持 reasoning 的模型会解析为 `medium` 或该模型最接近的受支持非 `off` 级别，而不支持 reasoning 的模型则保持为 `off`。

## 设置会话默认值

- 发送一条**仅包含**指令的消息（可包含空白），例如 `/think:medium` 或 `/t high`。
- 该设置会固定到当前会话（默认按发送者）；可通过 `/think:off` 或会话空闲重置清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，同时会话状态保持不变。
- 发送无参数的 `/think`（或 `/think:`）可查看当前 thinking 级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送无模式参数的 `/fast`（或 `/fast status`）可查看当前实际生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖
  3. 按智能体默认值（`agents.list[].fastModeDefault`）
  4. 按模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射到 OpenAI 优先级处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 会在两种 auth 路径之间共享一个 `/fast` 开关。
- 对于直接公开的 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic service tiers：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当两者都设置时，显式的 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic service-tier 注入。
- 仅当启用了快速模式时，`/status` 才会显示 `Fast`。

## 详细输出指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细输出并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储显式的会话覆盖；可在会话 UI 中选择 `inherit` 清除它。
- 内联指令仅对该条消息生效；其他情况下使用会话/全局默认值。
- 发送无参数的 `/verbose`（或 `/verbose:`）可查看当前详细输出级别。
- 当 verbose 为 on 时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为各自独立的纯元数据消息发回；若有可用参数（路径/命令），前缀格式为 `<emoji> <tool-name>: <arg>`。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍可见，但原始错误详情后缀只有在 verbose 为 `on` 或 `full` 时才显示。
- 当 verbose 为 `full` 时，工具输出在完成后也会被转发（单独气泡，并截断到安全长度）。如果你在运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件 trace 指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅对该条消息生效；其他情况下使用会话/全局默认值。
- 发送无参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它仅暴露插件拥有的 trace/debug 行，例如 Active Memory 调试摘要。
- Trace 行可能会出现在 `/status` 中，也可能在正常助手回复后作为后续诊断消息出现。

## Reasoning 可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示 thinking 块。
- 启用后，reasoning 会作为一条**单独消息**发送，前缀为 `Reasoning:`。
- `stream`（仅 Telegram）：在回复生成期间将 reasoning 流式写入 Telegram 草稿气泡，然后发送不含 reasoning 的最终答案。
- 别名：`/reason`。
- 发送无参数的 `/reasoning`（或 `/reasoning:`）可查看当前 reasoning 级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是按智能体默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

## 相关内容

- 高级模式文档位于 [高级模式](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文是已配置的心跳提示词（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会像往常一样生效（但应避免通过心跳更改会话默认值）。
- 心跳投递默认仅发送最终载荷。若也要发送单独的 `Reasoning:` 消息（若可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或按智能体设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天 thinking 选择器在页面加载时，会镜像入站会话存储/配置中该会话的已存储级别。
- 选择另一个级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自当前活跃会话模型的提供商 thinking 配置文件，以及与 `/status` 和 `session_status` 相同的回退逻辑。
- 选择器使用 Gateway 网关会话行返回的 `thinkingOptions`。浏览器 UI 不会维护自己的提供商 regex 列表；模型特定级别集合由插件负责。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## 提供商配置文件

- 提供商插件可以暴露 `resolveThinkingProfile(ctx)` 来定义模型支持的级别和默认值。
- 每个配置文件级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 已发布的旧版 hooks（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行会暴露 `thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时验证所使用的相同配置文件。
