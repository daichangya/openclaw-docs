---
read_when:
    - 诊断凭证配置轮换、冷却机制或模型回退行为
    - 更新凭证配置或模型的回退规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换凭证配置，并在不同模型之间进行回退
title: 模型回退
x-i18n:
    generated_at: "2026-04-26T21:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3127f0b0ad76f8654685ae4446f2c7d82be8367bcd631e2f4ed160fc3457cfe7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**凭证配置轮换**。
2. 切换到 `agents.defaults.model.fallbacks` 中下一个模型的**模型回退**。

本文档解释运行时规则，以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前活跃的会话模型和凭证配置偏好。
  </Step>
  <Step title="构建候选链">
    从当前选定的会话模型开始构建模型候选链，然后按顺序追加 `agents.defaults.model.fallbacks`，如果本次运行是从覆盖项开始，则最后以已配置的主模型结束。
  </Step>
  <Step title="尝试当前提供商">
    使用凭证配置轮换 / 冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得回退的错误上前进">
    如果该提供商因值得回退的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖">
    在重试开始之前持久化选中的回退覆盖，这样其他会话读取方就能看到运行器即将使用的相同提供商 / 模型。
  </Step>
  <Step title="在失败时进行精确回滚">
    如果回退候选项失败，则仅在回退拥有的会话覆盖字段仍与该失败候选项匹配时，回滚这些字段。
  </Step>
  <Step title="在耗尽时抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及在已知时最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器仅持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这样可以防止失败的回退重试覆盖较新的无关会话变更，例如在该尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**凭证配置**。

- 密钥存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版位置：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时凭证路由状态存放在 `~/.openclaw/agents/<agentId>/agent/auth-state.json`。
- 配置 `auth.profiles` / `auth.order` **仅用于元数据 + 路由**（不包含密钥）。
- 仅用于旧版导入的 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）。

更多详情： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还会附带 `projectId` / `enterpriseUrl`）

## 配置 ID

OAuth 登录会创建不同的配置，这样多个账号可以共存。

- 默认：当没有可用邮箱时使用 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

这些配置位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置时，OpenClaw 会按如下方式选择顺序：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置的配置">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储的配置">
    `auth-profiles.json` 中该提供商对应的条目。
  </Step>
</Steps>

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主键：** 配置类型（**OAuth 优先于 API 密钥**）。
- **次键：** `usageStats.lastUsed`（越久未使用越优先，在每种类型内排序）。
- **处于冷却 / 已禁用的配置** 会被移到末尾，并按最早到期时间排序。

### 会话粘性（有利于缓存）

OpenClaw 会**按会话固定所选凭证配置**，以保持提供商缓存处于热状态。它**不会**在每次请求时轮换。被固定的配置会持续复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置处于冷却 / 已禁用状态

通过 `/model …@<profileId>` 进行手动选择会为该会话设置**用户覆盖**，在新会话开始前不会自动轮换。

<Note>
自动固定的配置（由会话路由器选中）会被视为一种**偏好**：它们会被优先尝试，但在遇到限流 / 超时时，OpenClaw 可能会轮换到另一个配置。用户固定的配置会保持锁定在该配置上；如果它失败，并且已配置模型回退，OpenClaw 会移动到下一个模型，而不是切换配置。
</Note>

### 为什么 OAuth 可能“看起来丢失了”

如果你对同一个提供商同时拥有 OAuth 配置和 API 密钥配置，在未固定的情况下，轮询可能会在不同消息之间在它们之间切换。若要强制使用单一配置：

- 使用 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 通过 `/model …` 配合配置覆盖使用每会话覆盖（当你的 UI / 聊天界面支持时）。

## 冷却机制

当某个配置因凭证 / 限流错误失败时（或因看起来像限流的超时失败时），OpenClaw 会将其标记为冷却中，并切换到下一个配置。

<AccordionGroup>
  <Accordion title="哪些情况会进入限流 / 超时类别">
    该限流类别比单纯的 `429` 更广：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及周期性用量窗口限制，例如 `weekly/monthly limit reached`。

    格式 / 无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）会被视为值得回退，并使用相同的冷却机制。与 OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时 / 回退信号。

    当来源匹配已知的瞬时模式时，通用服务器文本也可能进入该超时类别。例如，裸的 pi-ai stream-wrapper 消息 `An unknown error occurred` 会被视为对所有提供商都值得回退，因为 pi-ai 会在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束但没有具体细节时发出它。带有瞬时服务器文本（例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`）的 JSON `api_error` 负载，也会被视为值得回退的超时。

    OpenRouter 特有的通用上游文本，例如裸的 `Provider returned error`，只有在提供商上下文实际是 OpenRouter 时才会被视为超时。通用的内部回退文本，例如 `LLM request failed with an unknown error.`，则保持保守，不会单独触发回退。

  </Accordion>
  <Accordion title="SDK retry-after 上限">
    某些提供商 SDK 在将控制权交还给 OpenClaw 之前，可能会先在较长的 `Retry-After` 时间窗口内休眠。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间限制在 60 秒内，并立即暴露更长的可重试响应，以便运行这条回退路径。你可以使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；参见 [重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域冷却">
    限流冷却也可以限定在模型作用域：

    - 当已知失败模型 ID 时，OpenClaw 会为限流失败记录 `cooldownModel`。
    - 如果冷却限定在另一个模型上，同一提供商下的兄弟模型仍然可以尝试。
    - 计费 / 禁用窗口仍会在所有模型上阻止整个配置。

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

计费 / 余额失败（例如“积分不足” / “余额过低”）会被视为值得回退，但它们通常不是瞬时问题。OpenClaw 不会使用短冷却，而是会将该配置标记为**已禁用**（使用更长的退避时间），然后轮换到下一个配置 / 提供商。

<Note>
并非每个看起来像计费问题的响应都是 `402`，也并非每个 HTTP `402` 都会进入这里。即使提供商返回的是 `401` 或 `403`，OpenClaw 也会将显式的计费文本保留在计费通道中，但提供商特定匹配器仍然仅限于拥有它们的提供商（例如 OpenRouter 的 `403 Key limit exceeded`）。

与此同时，临时性的 `402` 用量窗口以及组织 / 工作区支出限制错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些情况会走短冷却 / 回退路径，而不是长时间的计费禁用路径。
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

- 计费退避从**5 小时**开始，每次计费失败翻倍，并在 **24 小时** 时封顶。
- 如果某个配置 **24 小时** 内没有失败，退避计数器会重置（可配置）。
- 过载重试在模型回退前允许进行 **1 次同提供商配置轮换**。
- 过载重试默认使用 **0 毫秒**退避。

## 模型回退

如果某个提供商的所有配置都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于已耗尽配置轮换的凭证失败、限流和超时（其他错误不会推进回退）。

与计费冷却相比，过载和限流错误会被更积极地处理。默认情况下，OpenClaw 允许一次同提供商凭证配置重试，然后立即切换到下一个已配置的模型回退而不等待。像 `ModelNotReadyException` 这样的提供商繁忙信号会进入该过载类别。你可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 来调整这一行为。

当一次运行从模型覆盖开始时（hooks 或 CLI），回退在尝试完所有已配置回退之后，仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 以及已配置的回退来构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位。
    - 显式配置的回退会去重，但不会按模型 allowlist 过滤。它们被视为显式的运维意图。
    - 如果当前运行已经位于同一提供商系列中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链。
    - 如果当前运行位于与配置不同的提供商上，并且该当前模型尚未属于已配置回退链的一部分，OpenClaw 不会追加来自另一提供商的无关已配置回退。
    - 当运行是从覆盖开始时，已配置的主模型会被追加到末尾，这样在更早候选项耗尽后，候选链可以重新收敛到正常默认值。
  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="会继续前进的情况">
    - 凭证失败
    - 限流和冷却耗尽
    - 过载 / 提供商繁忙错误
    - 具有超时特征的回退错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被规范化为一条回退路径，这样过期的持久化模型就不会形成外层重试循环
    - 当仍有剩余候选项时，其他未识别错误
  </Tab>
  <Tab title="不会继续前进的情况">
    - 不属于超时 / 回退特征的显式中止
    - 应保留在压缩 / 重试逻辑内的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model`，或 `ollama error: context length exceeded`）
    - 当没有剩余候选项时的最终未知错误
  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的每个凭证配置都已经处于冷却中时，OpenClaw 不会永远自动跳过该提供商。它会针对每个候选项单独做决定：

<AccordionGroup>
  <Accordion title="按候选项的决策">
    - 持续性的凭证失败会立即跳过整个提供商。
    - 计费禁用通常会被跳过，但主候选项仍然可能在节流条件下被探测，以便无需重启也能恢复。
    - 主候选项可能会在接近冷却到期时被探测，并带有按提供商划分的节流限制。
    - 即使存在冷却，只要失败看起来是瞬时性的（`rate_limit`、`overloaded` 或未知），同一提供商下的回退兄弟项仍可被尝试。当限流是模型作用域，而兄弟模型可能仍能立即恢复时，这一点尤其重要。
    - 瞬时冷却探测在每次回退运行中，每个提供商最多只允许一次，这样单个提供商就不会拖慢跨提供商回退。
  </Accordion>
</AccordionGroup>

## 会话覆盖与实时模型切换

会话模型变更是共享状态。活跃运行器、`/model` 命令、压缩 / 会话更新以及实时会话协调，都会读取或写入同一个会话条目的不同部分。

这意味着回退重试必须与实时模型切换协同：

- 只有显式的用户驱动模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 由系统驱动的模型变更，例如回退轮换、心跳覆盖或压缩，本身不会标记待处理的实时切换。
- 在回退重试开始前，回复运行器会将所选回退覆盖字段持久化到会话条目中。
- 实时会话协调会优先使用持久化的会话覆盖，而不是过期的运行时模型字段。
- 如果实时切换错误指向当前回退链中更靠后的候选项，OpenClaw 会直接跳到该选定模型，而不是先遍历无关候选项。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，而且仅当这些字段仍与该失败候选项匹配时才会回滚。

这可以避免经典竞态：

<Steps>
  <Step title="主模型失败">
    选中的主模型失败。
  </Step>
  <Step title="在内存中选定回退项">
    回退候选项在内存中被选定。
  </Step>
  <Step title="会话存储仍显示旧主模型">
    会话存储仍反映旧的主模型。
  </Step>
  <Step title="实时协调读取过期状态">
    实时会话协调读取到过期的会话状态。
  </Step>
  <Step title="重试被拉回旧模型">
    在回退尝试开始之前，重试被拉回到旧模型。
  </Step>
</Steps>

持久化的回退覆盖会关闭这个窗口，而精确回滚则能保持较新的手动或运行时会话变更不受影响。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却提示：

- 尝试过的提供商 / 模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的回退原因）
- 可选的状态 / 代码
- 人类可读的错误摘要

当每个候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以用它来构建更具体的消息，例如“所有模型都暂时受到限流”，并在已知时附带最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 与已尝试提供商 / 模型链无关的模型作用域限流会被忽略
- 如果剩余阻塞是一个匹配的模型作用域限流，OpenClaw 会报告仍然阻止该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见 [Models](/zh-CN/concepts/models) 了解更广泛的模型选择和回退概览。
