---
read_when:
    - 诊断认证配置文件轮换、冷却时间或模型回退行为
    - 更新认证配置文件或模型的回退规则
    - 了解会话模型覆盖如何与回退重试交互
sidebarTitle: Model failover
summary: OpenClaw 如何轮换认证配置文件，以及如何在多个模型之间回退
title: 模型回退
x-i18n:
    generated_at: "2026-04-26T11:10:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw 分两个阶段处理失败：

1. 当前提供商内的**认证配置文件轮换**
2. 回退到 `agents.defaults.model.fallbacks` 中的下一个**模型**

本文档说明运行时规则以及支撑这些规则的数据。

## 运行时流程

对于一次普通的文本运行，OpenClaw 会按以下顺序评估候选项：

<Steps>
  <Step title="解析会话状态">
    解析当前活跃的会话模型和认证配置文件偏好。
  </Step>
  <Step title="构建候选链">
    从当前选中的会话模型开始构建模型候选链，然后按顺序追加 `agents.defaults.model.fallbacks`，如果本次运行是从覆盖项开始的，则最后以已配置的主模型结尾。
  </Step>
  <Step title="尝试当前提供商">
    使用认证配置文件轮换 / 冷却规则尝试当前提供商。
  </Step>
  <Step title="在值得回退的错误上继续前进">
    如果该提供商因值得回退的错误而耗尽，则移动到下一个模型候选项。
  </Step>
  <Step title="持久化回退覆盖项">
    在重试开始前持久化所选的回退覆盖项，这样其他会话读取方就会看到运行器即将使用的同一提供商 / 模型。
  </Step>
  <Step title="在失败时进行精确回滚">
    如果回退候选项失败，只回滚那些仍与该失败候选项匹配、且由回退所拥有的会话覆盖字段。
  </Step>
  <Step title="如果耗尽则抛出 FallbackSummaryError">
    如果每个候选项都失败，则抛出一个 `FallbackSummaryError`，其中包含每次尝试的详细信息，以及已知情况下最早的冷却到期时间。
  </Step>
</Steps>

这有意比“保存并恢复整个会话”更窄。回复运行器只持久化它为回退所拥有的模型选择字段：

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

这可以防止一次失败的回退重试覆盖掉更新的、无关的会话变更，例如在尝试运行期间发生的手动 `/model` 更改或会话轮换更新。

## 凭证存储（密钥 + OAuth）

OpenClaw 对 API 密钥和 OAuth 令牌都使用**认证配置文件**。

- 密钥保存在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中（旧版路径：`~/.openclaw/agent/auth-profiles.json`）。
- 运行时认证路由状态保存在 `~/.openclaw/agents/<agentId>/agent/auth-state.json` 中。
- 配置 `auth.profiles` / `auth.order` **只包含元数据 + 路由信息**（不包含密钥）。
- 旧版仅导入用的 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json` 中）。

更多详情： [OAuth](/zh-CN/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（某些提供商还会包含 `projectId` / `enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建不同的配置文件，因此多个账户可以共存。

- 默认值：当没有可用邮箱时，使用 `provider:default`
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）

配置文件保存在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 会按以下顺序选择：

<Steps>
  <Step title="显式配置">
    `auth.order[provider]`（如果已设置）。
  </Step>
  <Step title="已配置的配置文件">
    按提供商过滤后的 `auth.profiles`。
  </Step>
  <Step title="已存储的配置文件">
    `auth-profiles.json` 中该提供商对应的条目。
  </Step>
</Steps>

如果没有配置显式顺序，OpenClaw 会使用轮询顺序：

- **主排序键：** 配置文件类型（**OAuth 优先于 API 密钥**）
- **次排序键：** `usageStats.lastUsed`（最早使用的优先，在各自类型内部排序）
- **处于冷却 / 已禁用的配置文件**会移到末尾，并按最早到期时间排序

### 会话粘性（对缓存更友好）

OpenClaw 会**按会话固定所选的认证配置文件**，以保持提供商缓存处于热状态。它**不会**在每次请求时轮换。固定的配置文件会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 一次压缩完成（压缩计数递增）
- 该配置文件进入冷却 / 被禁用

通过 `/model …@<profileId>` 进行的手动选择会为该会话设置一个**用户覆盖项**，在新会话开始之前不会自动轮换。

<Note>
自动固定的配置文件（由会话路由器选择）会被视为一种**偏好**：会先尝试它，但如果遇到速率限制 / 超时，OpenClaw 可能会轮换到另一个配置文件。用户固定的配置文件会始终锁定在该配置文件；如果它失败且配置了模型回退，OpenClaw 会移动到下一个模型，而不是切换配置文件。
</Note>

### 为什么 OAuth 可能“看起来像丢了”

如果你对同一个提供商同时拥有一个 OAuth 配置文件和一个 API 密钥配置文件，轮询可能会在不同消息之间切换它们，除非已固定。要强制使用单个配置文件：

- 通过 `auth.order[provider] = ["provider:profileId"]` 固定，或者
- 通过 `/model …` 使用带配置文件覆盖项的按会话覆盖（当你的 UI / 聊天界面支持时）

## 冷却

当某个配置文件因为认证 / 速率限制错误失败时（或因为看起来像速率限制的超时失败时），OpenClaw 会将其标记为进入冷却，并移动到下一个配置文件。

<AccordionGroup>
  <Accordion title="哪些情况会进入速率限制 / 超时类别">
    该速率限制类别不止包含普通的 `429`：它还包括提供商消息，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`throttled`、`resource exhausted`，以及诸如 `weekly/monthly limit reached` 这样的周期性使用窗口限制。

    格式 / 无效请求错误（例如 Cloud Code Assist 工具调用 ID 校验失败）会被视为值得回退，并使用相同的冷却时间。OpenAI 兼容的停止原因错误，例如 `Unhandled stop reason: error`、`stop reason: error` 和 `reason: error`，会被归类为超时 / 回退信号。

    通用服务器文本在来源匹配已知瞬时模式时，也可能进入该超时类别。例如，纯粹的 pi-ai 流包装器消息 `An unknown error occurred` 会被视为所有提供商都值得回退的错误，因为 pi-ai 在提供商流以 `stopReason: "aborted"` 或 `stopReason: "error"` 结束且没有具体细节时会发出它。带有瞬时服务器文本的 JSON `api_error` 负载，例如 `internal server error`、`unknown error, 520`、`upstream error` 或 `backend error`，也会被视为值得回退的超时。

    OpenRouter 特有的通用上游文本，例如单独出现的 `Provider returned error`，只有在提供商上下文确实是 OpenRouter 时才会被视为超时。通用内部回退文本，例如 `LLM request failed with an unknown error.`，则会保持保守，不会仅凭自身触发回退。

  </Accordion>
  <Accordion title="SDK 的 retry-after 上限">
    某些提供商 SDK 否则可能会在将控制权交还给 OpenClaw 之前，先休眠一个很长的 `Retry-After` 时间窗口。对于基于 Stainless 的 SDK，例如 Anthropic 和 OpenAI，OpenClaw 默认会将 SDK 内部的 `retry-after-ms` / `retry-after` 等待时间上限设为 60 秒，并立即暴露更长的可重试响应，以便运行这条回退路径。可通过 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` 调整或禁用该上限；参见 [重试行为](/zh-CN/concepts/retry)。
  </Accordion>
  <Accordion title="模型作用域冷却">
    速率限制冷却也可以具有模型作用域：

    - 当已知失败模型 ID 时，OpenClaw 会为速率限制失败记录 `cooldownModel`
    - 当冷却作用于不同模型时，同一提供商下的兄弟模型仍然可以尝试
    - 计费 / 禁用窗口仍会在所有模型上阻止整个配置文件

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

计费 / 额度失败（例如“额度不足” / “余额过低”）会被视为值得回退，但它们通常不是瞬时错误。OpenClaw 不会使用短冷却，而是将该配置文件标记为**已禁用**（使用更长的退避时间），并轮换到下一个配置文件 / 提供商。

<Note>
并不是每个看起来像计费问题的响应都是 `402`，也不是每个 HTTP `402` 都会落到这里。即使某个提供商返回的是 `401` 或 `403`，OpenClaw 仍会将显式的计费文本保留在计费通道中，但提供商特定的匹配器仍然限定在拥有它们的提供商范围内（例如 OpenRouter 的 `403 Key limit exceeded`）。

同时，临时性的 `402` 使用窗口以及组织 / 工作区支出限制错误，如果消息看起来可重试（例如 `weekly usage limit exhausted`、`daily limit reached, resets tomorrow` 或 `organization spending limit exceeded`），则会被归类为 `rate_limit`。这些错误会走短冷却 / 回退路径，而不是长时间的计费禁用路径。
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

- 计费退避从**5 小时**开始，每次计费失败翻倍，并在 **24 小时**封顶
- 如果某个配置文件在 **24 小时**内没有再次失败，退避计数器会重置（可配置）
- 过载重试允许在模型回退前进行 **1 次同提供商配置文件轮换**
- 过载重试默认使用 **0 毫秒**退避

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会移动到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于耗尽了配置文件轮换的认证失败、速率限制和超时（其他错误不会推进回退）。

与计费冷却相比，过载和速率限制错误的处理更激进。默认情况下，OpenClaw 允许进行一次同提供商认证配置文件重试，然后无等待地切换到下一个已配置的模型回退。像 `ModelNotReadyException` 这样的提供商繁忙信号会归入该过载类别。你可以通过 `auth.cooldowns.overloadedProfileRotations`、`auth.cooldowns.overloadedBackoffMs` 和 `auth.cooldowns.rateLimitedProfileRotations` 来调整这一行为。

当一次运行以模型覆盖项开始时（hooks 或 CLI），在尝试完所有已配置回退后，回退链仍会以 `agents.defaults.model.primary` 结束。

### 候选链规则

OpenClaw 会根据当前请求的 `provider/model` 和已配置的回退项构建候选列表。

<AccordionGroup>
  <Accordion title="规则">
    - 请求的模型始终排在第一位
    - 显式配置的回退项会去重，但不会按模型 allowlist 过滤。它们会被视为操作员的显式意图
    - 如果当前运行已经处于同一提供商族中的某个已配置回退上，OpenClaw 会继续使用完整的已配置链
    - 如果当前运行使用的提供商与配置不同，并且该当前模型本身不在已配置的回退链中，OpenClaw 不会追加来自其他提供商的无关已配置回退项
    - 当运行起始于某个覆盖项时，已配置的主模型会追加到末尾，这样在较早候选项耗尽后，候选链可以回到正常默认值

  </Accordion>
</AccordionGroup>

### 哪些错误会推进回退

<Tabs>
  <Tab title="会继续处理的情况">
    - 认证失败
    - 速率限制和冷却耗尽
    - 过载 / 提供商繁忙错误
    - 具有超时特征的回退错误
    - 计费禁用
    - `LiveSessionModelSwitchError`，它会被标准化为回退路径，这样过时的持久化模型就不会形成外层重试循环
    - 当仍有剩余候选项时，其他未识别错误
  </Tab>
  <Tab title="不会继续处理的情况">
    - 不具有超时 / 回退特征的显式中止
    - 应保留在压缩 / 重试逻辑内部处理的上下文溢出错误（例如 `request_too_large`、`INVALID_ARGUMENT: input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`The input is too long for the model` 或 `ollama error: context length exceeded`）
    - 当没有剩余候选项时，最终的未知错误
  </Tab>
</Tabs>

### 冷却跳过与探测行为

当某个提供商的所有认证配置文件都已处于冷却中时，OpenClaw 不会永远自动跳过该提供商。它会针对每个候选项单独做决定：

<AccordionGroup>
  <Accordion title="针对每个候选项的决策">
    - 持续性的认证失败会立即跳过整个提供商。
    - 计费禁用通常会被跳过，但主候选项仍可在节流限制下进行探测，因此无需重启也能恢复。
    - 在接近冷却到期时，主候选项可能会被探测，并带有按提供商设置的节流限制。
    - 即使处于冷却中，同一提供商下的回退兄弟模型也可以在失败看起来是瞬时问题（`rate_limit`、`overloaded` 或 unknown）时继续尝试。这在速率限制具有模型作用域、而兄弟模型可能立即恢复时尤其重要。
    - 瞬时冷却探测在每次回退运行中每个提供商最多只允许一次，这样单个提供商就不会拖慢跨提供商回退。
  </Accordion>
</AccordionGroup>

## 会话覆盖项与实时模型切换

会话模型变更属于共享状态。活跃运行器、`/model` 命令、压缩 / 会话更新以及实时会话协调都会读取或写入同一会话条目的部分内容。

这意味着回退重试必须与实时模型切换协调：

- 只有显式的用户驱动模型变更才会标记待处理的实时切换。这包括 `/model`、`session_status(model=...)` 和 `sessions.patch`。
- 回退轮换、心跳覆盖项或压缩等系统驱动的模型变更本身绝不会标记待处理的实时切换。
- 在回退重试开始前，回复运行器会将所选回退覆盖字段持久化到会话条目中。
- 实时会话协调会优先使用持久化的会话覆盖项，而不是过时的运行时模型字段。
- 如果回退尝试失败，运行器只会回滚它写入的覆盖字段，并且仅在这些字段仍与该失败候选项匹配时才会回滚。

这可以防止经典竞态：

<Steps>
  <Step title="主模型失败">
    所选的主模型失败。
  </Step>
  <Step title="在内存中选定回退">
    在内存中选定回退候选项。
  </Step>
  <Step title="会话存储仍指向旧主模型">
    会话存储仍然反映旧的主模型。
  </Step>
  <Step title="实时协调读取过时状态">
    实时会话协调读取过时的会话状态。
  </Step>
  <Step title="重试被切回">
    在回退尝试开始之前，重试被切回到旧模型。
  </Step>
</Steps>

持久化的回退覆盖项填补了这个窗口，而精确回滚则能保持较新的手动或运行时会话变更不受影响。

## 可观测性与失败摘要

`runWithModelFallback(...)` 会记录每次尝试的详细信息，用于日志和面向用户的冷却消息：

- 尝试过的提供商 / 模型
- 原因（`rate_limit`、`overloaded`、`billing`、`auth`、`model_not_found` 以及类似的回退原因）
- 可选的 status / code
- 人类可读的错误摘要

当所有候选项都失败时，OpenClaw 会抛出 `FallbackSummaryError`。外层回复运行器可以利用它构建更具体的消息，例如“所有模型当前都暂时受到速率限制”，并在已知时包含最早的冷却到期时间。

该冷却摘要具有模型感知能力：

- 与已尝试的提供商 / 模型链无关的模型作用域速率限制会被忽略
- 如果剩余阻塞是匹配的模型作用域速率限制，OpenClaw 会报告仍阻止该模型的最后一个匹配到期时间

## 相关配置

参见 [Gateway 网关配置](/zh-CN/gateway/configuration)：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

更广义的模型选择和回退概览，参见 [Models](/zh-CN/concepts/models)。
