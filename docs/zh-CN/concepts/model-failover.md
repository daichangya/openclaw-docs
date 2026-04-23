---
read_when:
    - 诊断认证配置档案轮换、冷却或模型回退行为
    - 更新认证配置档案或模型的故障转移规则
    - 了解会话模型覆盖如何与回退重试交互
summary: OpenClaw 如何轮换认证配置档案并在模型之间回退
title: 模型故障转移
x-i18n:
    generated_at: "2026-04-23T20:46:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 在当前提供商内进行**认证配置档案轮换**。
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文说明运行时规则及其背后的数据。

## 运行时流程

对于普通文本运行，OpenClaw 按以下顺序评估候选项：

1. 当前选定的会话模型。
2. 按顺序配置的 `agents.defaults.model.fallbacks`。
3. 如果本次运行起始于一个覆盖项，则在最后追加已配置的主模型。

在每个候选项内部，OpenClaw 会先尝试认证配置档案故障转移，然后才会进入下一个模型候选项。

高层流程如下：

1. 解析当前活动的会话模型和认证配置档案偏好。
2. 构建模型候选链。
3. 按认证配置档案轮换/冷却规则尝试当前提供商。
4. 如果该提供商因值得故障转移的错误而耗尽，则移动到下一个模型候选项。
5. 在重试开始前持久化选定的回退覆盖项，以便其他会话读取器看到运行器即将使用的相同提供商/模型。
6. 如果回退候选项失败，则只在这些字段仍与失败候选项匹配时，回滚由回退拥有的会话覆盖字段。
7. 如果所有候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的细节，以及在已知情况下最早的冷却到期时间。

这比“保存并恢复整个会话”要更收窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可防止失败的回退重试覆盖较新的、无关的会话变更，例如在尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 认证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**认证配置档案**。

- 密钥保存在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时认证路由状态保存在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅**包含元数据 + 路由（不含密钥）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多详情：[/concepts/oauth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包括 `projectId`/`enterpriseUrl`）

## 配置档案 ID

OAuth 登录会创建不同的配置档案，以便多个账户共存。

- 默认：当没有 email 可用时为 `provider:default`。
- 带 email 的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置档案位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当某个提供商有多个配置档案时，OpenClaw 会按以下顺序选择：

1. **显式配置**：`auth.order[provider]`（如果已设置）。
2. **已配置配置档案**：按提供商过滤后的 `auth.profiles`。
3. **已存储配置档案**：`auth-profiles.json` 中该提供商的条目。

如果没有显式配置顺序，OpenClaw 会使用轮转顺序：

- **主键：** 配置档案类型（**OAuth 优先于 API 密钥**）。
- **次键：** `usageStats.lastUsed`（在每种类型内，最久未使用的优先）。
- **处于冷却/禁用状态的配置档案**会被移到末尾，并按最早到期时间排序。

### 会话黏性（有利于缓存）

OpenClaw 会**按会话固定所选认证配置档案**，以保持提供商缓存处于热状态。
它**不会**在每次请求时轮换。被固定的配置档案会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置档案处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖项**，
在新会话开始之前不会自动轮换。

自动固定的配置档案（由会话路由器选定）被视为一种**偏好**：
它们会被优先尝试，但在遇到速率限制/超时时，OpenClaw 可以轮换到其他配置档案。
用户固定的配置档案会锁定在该配置档案上；如果它失败且已配置模型回退，
OpenClaw 会移动到下一个模型，而不是切换配置档案。

### 为什么 OAuth 可能“看起来丢失了”

如果同一个提供商下同时有一个 OAuth 配置档案和一个 API 密钥配置档案，轮转可能会在消息之间切换它们，除非已固定。若要强制使用单个配置档案：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 通过 `/model …` 的配置档案覆盖项使用按会话覆盖（前提是你的 UI/聊天界面支持）。

## 冷却

当某个配置档案因认证/速率限制错误（或看起来像速率限制的超时）而失败时，OpenClaw 会将其标记为冷却中，并移动到下一个配置档案。
这个速率限制桶比普通的 `429` 更广：它还包括提供商消息，例如
`Too many concurrent requests`、`ThrottlingException`、
`concurrency limit reached`、`workers_ai ... quota limit exceeded`、
`throttled`、`resource exhausted`，以及周期性的用量窗口限制，例如
`weekly/monthly limit reached`。
格式/无效请求错误（例如 Cloud Code Assist 工具调用 ID
校验失败）也会被视为值得故障转移，并使用相同的冷却机制。
OpenAI 兼容的 stop-reason 错误，例如 `Unhandled stop reason: error`、
`stop reason: error` 和 `reason: error`，会被归类为超时/故障转移信号。
提供商作用域内的通用服务器文本，在来源匹配已知瞬时模式时，也可能归入该超时桶。例如，Anthropic 的裸文本
`An unknown error occurred` 以及带有瞬时服务器文本的 JSON `api_error` 载荷，如
`internal server error`、`unknown error, 520`、`upstream error`
或 `backend error`，都会被视为值得故障转移的超时。
OpenRouter 特有的通用上游文本，例如裸文本 `Provider returned error`，也只会在提供商上下文确实是 OpenRouter 时被视为超时。
通用内部回退文本，例如 `LLM request failed with an unknown error.`，
则保持保守，不会单独触发故障转移。

某些提供商 SDK 否则可能会在把控制权交还给 OpenClaw 之前，先睡眠一个很长的 `Retry-After` 窗口。
对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间上限限制为 60 秒，并立即暴露更长的可重试响应，以便此故障转移路径能够运行。
可使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；请参阅 [/concepts/retry](/zh-CN/concepts/retry)。

速率限制冷却也可以是按模型作用域的：

- 当已知失败模型 id 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
- 同一提供商上的兄弟模型仍可被尝试，只要冷却限定在不同模型上。
- 计费/禁用窗口仍会跨模型阻止整个配置档案。

冷却使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在 `auth-state.json` 的 `usageStats` 下：

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 计费禁用

计费/额度失败（例如 “insufficient credits” / “credit balance too low”）会被视为值得故障转移，但它们通常不是瞬时性的。OpenClaw 不会使用短冷却，而是会将该配置档案标记为**已禁用**（并采用更长的退避），然后轮换到下一个配置档案/提供商。

并非每个带有计费特征的响应都是 `402`，也并非每个 HTTP `402` 都会进入这里。OpenClaw 会在消息包含明确计费文本时将其保留在计费通道中，即使提供商返回的是 `401` 或 `403`，但提供商特定匹配器仍限定在拥有它们的提供商作用域中（例如 OpenRouter 的 `403 Key limit exceeded`）。同时，临时性的 `402` 用量窗口和组织/工作区支出限制错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些错误会保留在短冷却/故障转移路径中，而不是进入长期的计费禁用路径。

状态存储在 `auth-state.json` 中：

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

默认值：

- 计费退避从 **5 小时** 开始，每次计费失败翻倍，并在 **24 小时** 封顶。
- 如果某个配置档案 **24 小时** 内未再失败，退避计数器会重置（可配置）。
- 过载重试允许在模型回退前进行 **1 次同提供商配置档案轮换**。
- 过载重试默认使用 **0 ms 退避**。

## 模型回退

如果某个提供商的所有配置档案都失败，OpenClaw 会移动到
`agents.defaults.model.fallbacks` 中的下一个模型。这适用于认证失败、速率限制以及耗尽配置档案轮换的超时（其他错误不会推进回退）。

过载和速率限制错误的处理比计费冷却更激进。默认情况下，OpenClaw 允许一次同提供商认证配置档案重试，然后立即切换到下一个已配置的模型回退，无需等待。
提供商繁忙信号，例如 `ModelNotReadyException`，会进入该过载桶。
可通过 `auth.cooldowns.overloadedProfileRotations`、
`auth.cooldowns.overloadedBackoffMs` 和
`auth.cooldowns.rateLimitedProfileRotations` 进行调优。

当一次运行以模型覆盖项（hooks 或 CLI）开始时，回退在尝试完任何已配置回退后，仍会以 `agents.defaults.model.primary` 作为终点。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 以及已配置回退项构建候选列表。

规则：

- 请求的模型始终位于第一位。
- 显式配置的回退项会去重，但不会按模型 allowlist 过滤。它们被视为显式的运维意图。
- 如果当前运行已经位于同一提供商家族中的某个已配置回退项上，OpenClaw 会继续使用完整的已配置链。
- 如果当前运行位于与配置不同的提供商上，并且该当前模型尚未成为已配置回退链的一部分，OpenClaw 不会追加来自其他提供商的不相关已配置回退项。
- 当运行起始于一个覆盖项时，已配置的主模型会追加到末尾，这样在前面的候选项耗尽后，候选链仍可回到正常默认值。

### 哪些错误会推进回退

模型回退会在以下情况继续：

- 认证失败
- 速率限制和冷却耗尽
- 过载/提供商繁忙错误
- 类超时的故障转移错误
- 计费禁用
- `LiveSessionModelSwitchError`，它会被规范化到故障转移路径中，从而避免陈旧的持久化模型形成外层重试循环
- 当仍有剩余候选项时，其他未识别错误

模型回退不会在以下情况继续：

- 不属于超时/故障转移形态的显式中止
- 应留在压缩/重试逻辑内部处理的上下文溢出错误
  （例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model` 或 `ollama error: context
length exceeded`）
- 当没有候选项可用时，最终的未知错误

### 冷却跳过与探测行为

当某个提供商的所有认证配置档案都已处于冷却状态时，OpenClaw
不会自动永远跳过该提供商。它会按每个候选项做出决定：

- 持久性认证失败会立即跳过整个提供商。
- 计费禁用通常也会跳过，但主候选项仍可按节流策略进行探测，因此无需重启也能恢复。
- 临近冷却到期时，可以按每提供商节流策略探测主候选项。
- 即使处于冷却状态，同一提供商下的回退同级模型也仍可被尝试，只要失败看起来是瞬时性的（`rate_limit`、`overloaded` 或未知）。当速率限制是按模型作用域时，这一点尤其重要，因为同级模型可能仍可立即恢复。
- 瞬时冷却探测在每次回退运行中对每个提供商最多只允许一次，这样单个提供商就不会拖慢跨提供商回退。

## 会话覆盖与实时模型切换

会话模型更改是共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型更改才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型更改，例如回退轮换、心跳覆盖或压缩，本身不会标记待处理的实时切换。
- 在回退重试开始之前，回复运行器会将选定的回退覆盖字段持久化到会话条目中。
- 实时会话协调会优先采用持久化的会话覆盖项，而不是陈旧的运行时模型字段。
- 如果回退尝试失败，运行器只会回滚它所写入的覆盖字段，并且只在这些字段仍与失败候选项匹配时才回滚。

这样可避免经典竞争条件：

1. 主模型失败。
2. 在内存中选中了一个回退候选项。
3. 会话存储中仍然写着旧的主模型。
4. 实时会话协调读取了陈旧的会话状态。
5. 在回退尝试开始前，重试被拉回到旧模型。

持久化的回退覆盖项关闭了这个窗口，而收窄回滚则能保留较新的手动或运行时会话更改。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，这些信息会被日志和面向用户的冷却提示所使用：

- 尝试过的 provider/model
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的故障转移原因）
- 可选的 status/code
- 人类可读的错误摘要

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可利用它构建更具体的消息，例如“所有模型当前都被临时速率限制”，并在已知情况下包含最早的冷却到期时间。

该冷却摘要是模型感知的：

- 与已尝试 provider/model 链无关的按模型作用域速率限制会被忽略
- 如果剩余阻塞是匹配的按模型作用域速率限制，OpenClaw 会报告最后一个仍阻塞该模型的匹配到期时间

## 相关配置

请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration) 了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

更广泛的模型选择和回退概览，请参阅[模型](/zh-CN/concepts/models)。
