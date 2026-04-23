---
read_when:
    - 诊断凭证配置文件轮换、冷却时间或模型故障回退行为
    - 更新凭证配置文件或模型的故障回退规则
    - 了解会话模型覆盖如何与故障回退重试交互
summary: OpenClaw 如何轮换凭证配置文件并在不同模型之间回退
title: 模型故障回退
x-i18n:
    generated_at: "2026-04-23T02:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# 模型故障回退

OpenClaw 分两个阶段处理故障：

1. 当前提供商内的**凭证配置文件轮换**。
2. 故障回退到 `agents.defaults.model.fallbacks` 中的下一个**模型**。

本文档解释运行时规则及其背后的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

1. 当前选定的会话模型。
2. 按顺序配置的 `agents.defaults.model.fallbacks`。
3. 如果这次运行是从某个覆盖项开始的，则最后使用配置的主模型。

在每个候选项内部，OpenClaw 会先尝试凭证配置文件故障回退，然后才推进到下一个模型候选项。

高层级顺序如下：

1. 解析当前活跃的会话模型和凭证配置文件偏好。
2. 构建模型候选链。
3. 使用凭证配置文件轮换/冷却规则尝试当前提供商。
4. 如果该提供商因值得进行故障回退的错误而耗尽，则移动到下一个模型候选项。
5. 在重试开始前持久化选中的故障回退覆盖项，以便其他会话读取方看到运行器即将使用的同一提供商/模型。
6. 如果故障回退候选项失败，仅当会话中的故障回退所属覆盖字段仍匹配该失败候选项时，才回滚这些字段。
7. 如果所有候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及已知情况下最早的冷却到期时间。

这刻意比“保存并恢复整个会话”更窄。回复运行器只会持久化它为故障回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以防止一次失败的故障回退重试覆盖掉较新的、无关的会话变更，例如在尝试运行期间发生的手动 `/model` 变更或会话轮换更新。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置文件**。

- 密钥存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中（旧版路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时凭证路由状态存放在 `~/.openclaw/agents/<agentId>/agent/auth-state.json` 中。
- 配置 `auth.profiles` / `auth.order` **仅包含元数据 + 路由信息**（不包含密钥）。
- 旧版仅导入用 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多细节：[/concepts/oauth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还包含 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，以便多个账户共存。

- 默认：当没有可用邮箱时使用 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当某个提供商有多个配置文件时，OpenClaw 会按以下方式选择顺序：

1. **显式配置**：`auth.order[provider]`（如果已设置）。
2. **已配置的配置文件**：按提供商过滤后的 `auth.profiles`。
3. **已存储的配置文件**：`auth-profiles.json` 中该提供商的条目。

如果未配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：**配置文件类型（**OAuth 优先于 API 密钥**）。
- **次键：**`usageStats.lastUsed`（越早使用的越先尝试，同一类型内如此）。
- **冷却中/已禁用的配置文件**会被移到末尾，并按最早到期时间排序。

### 会话粘性（有利于缓存）

OpenClaw 会**按会话固定选定的凭证配置文件**，以保持提供商缓存处于预热状态。
它**不会**在每个请求上都轮换。固定的配置文件会持续复用，直到出现以下情况：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 配置文件处于冷却中/已禁用

通过 `/model …@<profileId>` 手动选择会为该会话设置一个**用户覆盖项**，在新会话开始前不会自动轮换。

自动固定的配置文件（由会话路由器选择）被视为一种**偏好**：
它们会被优先尝试，但 OpenClaw 可能会在遇到速率限制/超时时轮换到其他配置文件。
用户固定的配置文件会保持锁定在该配置文件上；如果它失败且已配置模型故障回退，OpenClaw 会移动到下一个模型，而不是切换配置文件。

### 为什么 OAuth 可能“看起来丢失了”

如果同一个提供商同时有一个 OAuth 配置文件和一个 API 密钥配置文件，在未固定的情况下，轮询可能会在不同消息之间切换它们。若要强制使用单一配置文件：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 使用带配置文件覆盖项的 `/model …` 设置每会话覆盖项（当你的 UI/聊天界面支持时）。

## 冷却时间

当某个配置文件因凭证/速率限制错误（或看起来像速率限制的超时）而失败时，OpenClaw 会将其标记为冷却中，并切换到下一个配置文件。
该速率限制桶不仅包含普通的 `429`：还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及诸如 `weekly/monthly limit reached` 之类的周期性用量窗口限制。
格式错误/无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）会被视为值得故障回退的错误，并使用相同的冷却机制。
OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时/故障回退信号。
当来源匹配已知的瞬时模式时，提供商范围的通用服务器文本也可能归入该超时桶。例如，Anthropic 的裸文本 `An unknown error occurred` 以及带有瞬时服务器文本的 JSON `api_error` 负载，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，都会被视为值得故障回退的超时。
OpenRouter 特有的通用上游文本，例如裸文本 `Provider returned error`，只有在提供商上下文确实是 OpenRouter 时才会被视为超时。
通用内部回退文本，例如 `LLM request failed with an unknown error.`，会保持保守策略，不会单独触发故障回退。

某些提供商 SDK 可能会在将控制权返回给 OpenClaw 之前，先休眠一个很长的 `Retry-After` 时间窗口。
对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间限制在 60 秒以内，并立即暴露更长的可重试响应，以便运行这条故障回退路径。
可通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该限制；参见 [/concepts/retry](/zh-CN/concepts/retry)。

速率限制冷却也可以是模型范围的：

- 当已知失败的模型 ID 时，OpenClaw 会为速率限制失败记录 `cooldownModel`。
- 同一提供商下的同级模型仍可在冷却范围限定为其他模型时继续尝试。
- 计费/禁用窗口仍会在不同模型之间阻止整个配置文件。

冷却时间使用指数退避：

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

计费/额度失败（例如“insufficient credits” / “credit balance too low”）会被视为值得故障回退的错误，但它们通常不是瞬时性的。
OpenClaw 不会设置一个短冷却时间，而是会将该配置文件标记为**已禁用**（使用更长的退避时间），并轮换到下一个配置文件/提供商。

并非每个看起来像计费问题的响应都是 `402`，也并非每个 HTTP `402` 都会进入这里。
即使某个提供商返回的是 `401` 或 `403`，OpenClaw 仍会将显式计费文本保留在计费通道中，但提供商特定匹配器会保持限定在拥有它们的提供商范围内（例如 OpenRouter 的 `403 Key limit exceeded`）。
与此同时，临时性的 `402` 用量窗口和组织/工作区支出限制错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。
这些情况会继续走短冷却/故障回退路径，而不是长时间的计费禁用路径。

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

- 计费退避从**5 小时**开始，每次计费失败翻倍，并在 **24 小时**封顶。
- 如果某个配置文件在 **24 小时**内未失败，退避计数器会重置（可配置）。
- 过载重试在模型故障回退之前，允许**1 次同提供商配置文件轮换**。
- 过载重试默认使用 **0 毫秒**退避。

## 模型故障回退

如果某个提供商的所有配置文件都失败了，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。
这适用于凭证失败、速率限制，以及已经耗尽配置文件轮换的超时（其他错误不会推进故障回退）。

与计费冷却相比，过载和速率限制错误会采用更激进的处理方式。
默认情况下，OpenClaw 允许一次同提供商凭证配置文件重试，然后不等待，直接切换到下一个已配置的模型故障回退。
诸如 `ModelNotReadyException` 之类的提供商繁忙信号会归入该过载桶。
可通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 进行调整。

当一次运行以模型覆盖项开始时（hooks 或 CLI），故障回退在尝试完所有已配置回退项后，仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 和已配置的故障回退构建候选列表。

规则：

- 请求的模型始终排在第一位。
- 显式配置的故障回退会去重，但不会按模型允许列表进行过滤。它们被视为明确的运维意图。
- 如果当前运行已经位于同一提供商家族中的某个已配置故障回退上，OpenClaw 会继续使用完整的已配置链。
- 如果当前运行使用的提供商与配置不同，且当前模型并不属于已配置的故障回退链，OpenClaw 不会附加来自其他提供商的无关已配置故障回退。
- 当运行是从某个覆盖项开始时，配置的主模型会被追加到末尾，以便在前面的候选项耗尽后，候选链可以重新回到正常的默认值。

### 哪些错误会推进故障回退

模型故障回退会在以下情况继续：

- 凭证失败
- 速率限制和冷却耗尽
- 过载/提供商繁忙错误
- 具有超时特征的故障回退错误
- 计费禁用
- `LiveSessionModelSwitchError`，它会被规范化为故障回退路径，以避免陈旧的持久化模型造成外层重试循环
- 当仍有剩余候选项时，其他未识别错误

模型故障回退不会在以下情况继续：

- 明确的中止，且不具备超时/故障回退特征
- 应保留在压缩/重试逻辑内部处理的上下文溢出错误
  （例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`The input is too long for the model` 或 `ollama error: context
length exceeded`）
- 当没有候选项剩余时的最终未知错误

### 冷却跳过与探测行为

当某个提供商的所有凭证配置文件都已处于冷却中时，OpenClaw 不会自动永久跳过该提供商。它会按每个候选项逐一做出决定：

- 持久性凭证失败会立即跳过整个提供商。
- 计费禁用通常会被跳过，但主候选项仍可按节流策略进行探测，这样无需重启也能恢复。
- 主候选项可能会在接近冷却到期时被探测，并带有每个提供商的节流限制。
- 即使处于冷却中，同一提供商下的故障回退同级模型仍然可以尝试，前提是该失败看起来是瞬时性的（`rate_limit`、`overloaded` 或未知）。当速率限制是模型范围的，而同级模型仍可能立即恢复时，这一点尤其重要。
- 瞬时冷却探测在每次故障回退运行中，每个提供商最多只允许一次，以避免单个提供商拖慢跨提供商故障回退。

## 会话覆盖项与实时模型切换

会话模型变更属于共享状态。活跃运行器、`/model` 命令、压缩/会话更新以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着故障回退重试必须与实时模型切换进行协调：

- 只有明确由用户驱动的模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型变更，例如故障回退轮换、心跳覆盖项或压缩，本身不会标记待处理的实时切换。
- 在故障回退重试开始之前，回复运行器会将选中的故障回退覆盖字段持久化到会话条目中。
- 实时会话协调会优先采用持久化的会话覆盖项，而不是过时的运行时模型字段。
- 如果故障回退尝试失败，运行器只会回滚它写入的覆盖字段，并且仅当这些字段仍与失败候选项匹配时才会回滚。

这可以防止经典竞争情况：

1. 主模型失败。
2. 在内存中选中了故障回退候选项。
3. 会话存储中仍然记录的是旧的主模型。
4. 实时会话协调读取到了过时的会话状态。
5. 在故障回退尝试开始前，重试被拉回到旧模型。

持久化的故障回退覆盖项关闭了这个时间窗口，而范围收窄的回滚则能保持较新的手动或运行时会话变更不受影响。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 尝试过的提供商/模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的故障回退原因）
- 可选的状态/代码
- 人类可读的错误摘要

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它来构建更具体的消息，例如“所有模型都暂时受到速率限制”，并在已知情况下包含最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 与已尝试的提供商/模型链无关的模型范围速率限制会被忽略
- 如果剩余阻塞项是匹配的模型范围速率限制，OpenClaw 会报告仍然阻止该模型的最后一个匹配到期时间

## 相关配置

有关以下内容，请参见[Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和故障回退概览，请参见[模型](/zh-CN/concepts/models)。
