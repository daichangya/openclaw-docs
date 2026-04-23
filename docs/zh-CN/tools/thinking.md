---
read_when:
    - 调整 thinking、fast 模式或 verbose 指令解析与默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 和推理可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-23T21:10:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: afa7a90ac91d108bd21c6bb50dc2db3520a4ce9b89fb31b541d5ef72faeb5988
    source_path: tools/thinking.md
    workflow: 15
---

# 思考级别（`/think` 指令）

## 它的作用

- 可在任何入站消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2 + Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应思考（适用于 Anthropic / Bedrock 上的 Claude 4.6 和 Anthropic Claude Opus 4.7）
  - max → 提供商的最大推理级别（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - thinking 菜单和选择器由提供商配置驱动。提供商插件会为所选模型声明精确的可用级别集合，包括像二元 `on` 这样的标签。
  - `adaptive`、`xhigh` 和 `max` 只会为支持它们的提供商 / 模型配置公开。对于不支持的级别，类型化指令会被拒绝，并提示该模型的有效选项。
  - 已存储但不受支持的旧级别会按提供商配置等级重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最高非 `off` 级别。
  - Anthropic Claude 4.6 模型在未显式设置 thinking 级别时，默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认启用自适应思考。除非你显式设置了 thinking 级别，否则它的 API effort 默认值仍由提供商控制。
  - 对于 Anthropic Claude Opus 4.7，`/think xhigh` 会映射到自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也支持 `/think max`；它会映射到相同的由提供商控制的最大 effort 路径。
  - OpenAI GPT 模型会通过模型特定的 Responses API effort 支持来映射 `/think`。只有当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的负载，而不是发送不受支持的值。
  - MiniMax（`minimax/*`）在 Anthropic 兼容流式路径上，默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置了 thinking。这可以避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支持二元 thinking（`on` / `off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。当启用 thinking 时，Moonshot 仅接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅适用于该条消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 按智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如果可用，则使用提供商声明的默认值；否则，具备推理能力的模型会解析为 `medium` 或该模型支持的最近非 `off` 级别，而非推理模型保持为 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 它会在当前会话中保持生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝，并给出提示，同时会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前 thinking 级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## Fast 模式（`/fast`）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话 fast 模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的 fast 模式状态。
- OpenClaw 按以下顺序解析 fast 模式：
  1. 内联 / 仅指令 `/fast on|off`
  2. 会话覆盖
  3. 按智能体默认值（`agents.list[].fastModeDefault`）
  4. 按模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，fast 模式会通过在受支持的 Responses 请求中发送 `service_tier=priority` 来映射到 OpenAI 优先级处理。
- 对于 `openai-codex/*`，fast 模式会在 Codex Responses 中发送相同的 `service_tier=priority` 标志。OpenClaw 在两条认证路径上共享同一个 `/fast` 开关。
- 对于直接公开的 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，fast 模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当同时设置了显式 Anthropic `serviceTier` / `service_tier` 模型参数时，它会覆盖 fast 模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。
- 只有在 fast 模式启用时，`/status` 才会显示 `Fast`。

## Verbose 指令（`/verbose` 或 `/v`）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话 verbose，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会改变状态。
- `/verbose off` 会存储一个显式的会话覆盖；可在 Sessions UI 中通过选择 `inherit` 清除。
- 内联指令仅影响当前消息；否则适用会话 / 全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前 verbose 级别。
- 当 verbose 开启时，输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为独立的仅元数据消息回发，并在可用时以 `<emoji> <tool-name>: <arg>` 作为前缀（路径 / 命令）。这些工具摘要会在每个工具启动时立即发送（独立气泡），而不是作为流式增量。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀会被隐藏，除非 verbose 为 `on` 或 `full`。
- 当 verbose 为 `full` 时，工具输出在完成后也会被转发（独立气泡，截断到安全长度）。如果你在运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响当前消息；否则适用会话 / 全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件自有的 trace / debug 行，例如 Active Memory 调试摘要。
- Trace 行可能出现在 `/status` 中，也可能作为普通助手回复后的跟进诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示 thinking 块。
- 启用后，推理会以**单独消息**的形式发送，并带有 `Reasoning:` 前缀。
- `stream`（仅 Telegram）：在回复生成期间，将推理流式写入 Telegram 草稿气泡，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后会话覆盖，然后按智能体默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

## 相关内容

- 提升权限模式文档请参阅 [提升权限模式](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文为已配置的 heartbeat prompt（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会照常生效（但应避免通过心跳更改会话默认值）。
- 心跳投递默认仅发送最终负载。如需同时发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或按智能体设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web chat UI

- 页面加载时，Web chat 的 thinking 选择器会镜像入站会话存储 / 配置中保存的会话级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活动会话模型的提供商 thinking 配置，以及 `/status` 和 `session_status` 使用的相同回退逻辑。
- 选择器使用 Gateway 网关会话行返回的 `thinkingOptions`。浏览器 UI 不维护自己的提供商正则列表；模型特定级别集合由插件持有。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器保持同步。

## 提供商配置

- 提供商插件可以暴露 `resolveThinkingProfile(ctx)` 来定义模型支持的级别和默认值。
- 每个配置级别都有一个存储用的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示用 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 已发布的旧版 hooks（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行会暴露 `thinkingOptions` 和 `thinkingDefault`，以便 ACP / 聊天客户端渲染与运行时验证所使用的同一套配置。
