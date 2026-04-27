---
read_when:
    - 诊断凭证配置文件轮换、冷却机制或模型回退行为
    - 更新凭证配置文件或模型的回退规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置文件并在不同模型之间回退
title: 模型回退
x-i18n:
    generated_at: "2026-04-27T08:31:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b6fd539fddce6f7dfee9bf04076026b09fb1b84c5c170578bca9643e0105bd4
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**凭证配置文件轮换**
2. **模型回退**到 `agents.defaults.model.fallbacks` 中的下一个模型

本文档解释运行时规则以及支撑这些规则的数据。

## 运行时流程

对于普通文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前激活的会话模型和凭证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    从当前选中的会话模型构建模型候选链，然后按顺序加入 `agents.defaults.model.fallbacks`，如果本次运行起始于某个覆盖项，则最终以已配置的主模型结尾。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置文件轮换/冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得回退的错误上前进">
    如果该提供商因值得回退的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始前持久化所选的回退覆盖，这样其他会话读取方就会看到运行器即将使用的相同提供商/模型。持久化的模型覆盖会标记为 `modelOverrideSource: "auto"`。
  </Step>
  <Step title="在失败时进行精确回滚">
    如果回退候选项失败，仅回滚由回退拥有的会话覆盖字段，前提是这些字段仍与该失败候选项匹配。
  </Step>
  <Step title="耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及已知情况下最早的冷却到期时间。
  </Step>
</Steps>

这刻意比“保存并恢复整个会话”更窄。回复运行器只会持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这可以防止失败的回退重试覆盖较新的无关会话变更，例如尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置文件**。

- 密钥保存在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时凭证路由状态保存在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅用于元数据 + 路由**（不包含密钥）。
- 旧版仅导入用 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多细节： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还会带 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账户可以共存。

- 默认：当没有可用邮箱时使用 `provider:default`
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）

配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按以下方式选择顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置的配置文件">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储的配置文件">
    `auth-profiles.json` 中属于该提供商的条目。
  </Step>
</Steps>

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主排序键：**配置文件类型（**OAuth 优先于 API 密钥**）
- **次排序键：**`usageStats.lastUsed`（同一类型内最久未使用优先）
- **处于冷却/已禁用的配置文件** 会被移到末尾，并按最早到期时间排序

### 会话粘性（有利于缓存）

OpenClaw 会**按会话固定所选的凭证配置文件**，以保持提供商缓存处于热状态。它**不会**在每次请求时轮换。固定的配置文件会被重复使用，直到发生以下情况之一：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置文件处于冷却/已禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖**，在新会话开始之前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选择）被视为一种**偏好**：它们会先被尝试，但 OpenClaw 可能会在遇到限流/超时时轮换到其他配置文件。用户固定的配置文件会保持锁定在该配置文件；如果它失败，并且已配置模型回退，OpenClaw 会移动到下一个模型，而不是切换配置文件。
</Note>

### 为什么 OAuth 可能“看起来丢失了”

如果你为同一个提供商同时拥有一个 OAuth 配置文件和一个 API 密钥配置文件，那么轮询可能会在不同消息之间切换它们，除非已固定。要强制使用单个配置文件：

- 通过 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 使用 `/model …` 加上配置文件覆盖进行按会话覆盖（在你的 UI / 聊天界面支持时）。

## 冷却

当某个配置文件因凭证/限流错误失败时（或者因看起来像限流的超时而失败），OpenClaw 会将其标记为冷却中，并移动到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会进入限流 / 超时桶">
    这个限流桶比单纯的 `429` 更宽：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及诸如 `weekly/monthly limit reached` 之类的周期性使用窗口限制。

    格式/无效请求错误（例如 Cloud Code Assist 工具调用 ID 验证失败）会被视为值得回退，并使用相同的冷却机制。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/回退信号。

    当来源匹配已知瞬时模式时，通用服务器文本也可能进入这个超时桶。例如，裸露的 pi-ai stream-wrapper 消息 `An unknown error occurred` 会被视为所有提供商都值得回退，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体细节时发出该消息。带有瞬时服务器文本的 JSON `api_error` 负载，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得回退的超时。

    OpenRouter 特有的通用上游文本，例如裸露的 `Provider returned error`，只有在提供商上下文确实是 OpenRouter 时才会被视为超时。像 `LLM request failed with an unknown error.` 这样的通用内部回退文本则保持保守，不会单独触发回退。
  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 否则可能会在将控制权交还给 OpenClaw 之前，因较长的 `Retry-After` 窗口而休眠很久。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间上限设为 60 秒，并立即暴露更长的可重试响应，以便这个回退路径能够运行。你可以使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用这个上限；参见 [Retry behavior](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域冷却">
    限流冷却也可以限定在模型作用域：

    - 当已知失败模型 ID 时，OpenClaw 会为限流失败记录 `cooldownModel`
    - 当冷却限定在不同模型时，同一提供商上的兄弟模型仍然可以被尝试
    - 计费/禁用窗口仍会跨模型阻止整个配置文件
  </Accordion>
</AccordionGroup>

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

计费/额度失败（例如“insufficient credits” / “credit balance too low”）会被视为值得回退，但它们通常不是瞬时性的。OpenClaw 不会使用短冷却，而是将该配置文件标记为**已禁用**（带有更长的退避时间），然后轮换到下一个配置文件/提供商。

<Note>
并非每个看起来像计费的响应都是 `402`，也并非每个 HTTP `402` 都会落入这里。即使某个提供商返回的是 `401` 或 `403`，OpenClaw 仍会将明确的计费文本保留在计费通道中，但提供商特定的匹配器仍会限定在拥有它们的提供商内（例如 OpenRouter 的 `403 Key limit exceeded`）。

同时，当消息看起来可重试时，临时性的 `402` 使用窗口和组织/工作区支出限制错误会被归类为 `rate_limit`（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`）。这些情况会保留在短冷却/回退路径中，而不是长时间的计费禁用路径。
</Note>

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

- 计费退避从 **5 小时**开始，每次计费失败翻倍，并在 **24 小时**封顶
- 如果某个配置文件 **24 小时**内没有失败，退避计数器会重置（可配置）
- 过载重试允许在模型回退之前进行 **1 次同提供商配置文件轮换**
- 过载重试默认使用 **0 毫秒**退避

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置文件轮换的凭证失败、限流和超时（其他错误不会推进回退）。

过载和限流错误比计费冷却处理得更激进。默认情况下，OpenClaw 允许进行一次同提供商凭证配置文件重试，然后立即切换到下一个已配置的模型回退而不等待。像 `ModelNotReadyException` 这样的提供商繁忙信号会落入这个过载桶。你可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 来调节这一行为。

当一次运行以模型覆盖开始时（钩子或 CLI），在尝试完所有已配置回退后，回退仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 以及已配置回退来构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会被模型允许列表过滤。它们会被视为显式的运维意图。
    - 如果当前运行已经处于同一提供商族中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行使用的是与配置不同的提供商，并且该当前模型还不是已配置回退链的一部分，OpenClaw 不会追加来自其他提供商的无关已配置回退。
    - 当运行起始于某个覆盖项时，已配置主模型会被追加到末尾，以便在更早的候选项耗尽后，候选链能够重新稳定回到正常默认值。
  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="以下情况会继续">
    - 凭证失败
    - 限流以及冷却耗尽
    - 过载/提供商繁忙错误
    - 呈现超时特征的回退错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被标准化到回退路径中，这样过期的已持久化模型就不会形成外层重试循环
    - 当仍有剩余候选项时，其他未识别错误
  </Tab>
  <Tab title="以下情况不会继续">
    - 不属于超时/回退特征的显式中止
    - 应保留在压缩/重试逻辑内部的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 当没有剩余候选项时的最终未知错误
  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的所有凭证配置文件都已处于冷却中时，OpenClaw 不会永远自动跳过该提供商。它会按每个候选项分别做出决定：

<AccordionGroup>
  <Accordion title="按候选项决策">
    - 持续性的凭证失败会立即跳过整个提供商。
    - 计费禁用通常会被跳过，但主候选项仍然可能在节流条件下被探测，以便无需重启也能恢复。
    - 主候选项可能会在接近冷却到期时被探测，并带有按提供商划分的节流。
    - 即使存在冷却，同一提供商中的回退兄弟模型仍可能在失败看起来是瞬时性的情况下被尝试（`rate_limit`、`overloaded` 或未知）。当限流限定在模型作用域，而兄弟模型可能仍可立即恢复时，这一点尤其重要。
    - 瞬时冷却探测在每次回退运行中每个提供商最多只允许一次，这样单个提供商就不会拖慢跨提供商回退。
  </Accordion>
</AccordionGroup>

## 会话覆盖与实时模型切换

会话模型变更属于共享状态。活动运行器、`/model` 命令、压缩/会话更新以及实时会话协调，都会读取或写入同一个会话条目的部分内容。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 系统驱动的模型变更，例如回退轮换、心跳覆盖或压缩，本身不会标记待处理的实时切换。
- 在回退重试开始前，回复运行器会将所选的回退覆盖字段持久化到会话条目中。
- 自动回退覆盖会在后续轮次中保持选中，因此 OpenClaw 不会在每条消息上都探测一个已知不可用的主模型。`/new`、`/reset` 和 `sessions.reset` 会清除自动来源的覆盖，并将会话恢复到已配置的默认值。
- `/status` 会显示所选模型；当回退状态不同，还会显示当前激活的回退模型和原因。
- 实时会话协调会优先使用已持久化的会话覆盖，而不是过期的运行时模型字段。
- 如果实时切换错误指向当前回退链中更靠后的候选项，OpenClaw 会直接跳转到该已选模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且仅当这些字段仍与该失败候选项匹配时才会回滚。

这可以防止经典竞态：

<Steps>
  <Step title="主模型失败">
    当前选中的主模型失败。
  </Step>
  <Step title="在内存中选定回退">
    在内存中选定回退候选项。
  </Step>
  <Step title="会话存储仍显示旧主模型">
    会话存储仍反映旧的主模型。
  </Step>
  <Step title="实时协调读取过期状态">
    实时会话协调读取过期的会话状态。
  </Step>
  <Step title="重试被拉回">
    在回退尝试开始前，重试被拉回到旧模型。
  </Step>
</Steps>

已持久化的回退覆盖关闭了这个窗口，而精确回滚则能保持较新的手动或运行时会话变更不受影响。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 尝试的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的回退原因）
- 可选的状态/代码
- 人类可读的错误摘要

当每个候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以利用它构建更具体的消息，例如“所有模型当前都被临时限流”，并在已知时包含最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 与已尝试提供商/模型链无关的模型作用域限流会被忽略
- 如果剩余阻塞是与之匹配的模型作用域限流，OpenClaw 会报告仍阻止该模型的最后一个匹配到期时间

## 相关配置

有关以下内容，请参见 [Gateway 配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和回退概览，请参见 [Models](/zh-CN/concepts/models)。
