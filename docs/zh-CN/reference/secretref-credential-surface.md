---
read_when:
    - 验证 SecretRef 凭证覆盖范围
    - 审计某个凭证是否有资格用于 `secrets configure` 或 `secrets apply`
    - 验证某个凭证为何不在受支持入口面之内
summary: 规范的受支持与不受支持的 SecretRef 凭证入口面
title: SecretRef 凭证入口面
x-i18n:
    generated_at: "2026-04-24T03:19:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb8d7660f2757e3d2a078c891f52325bf9ec9291ec7d5f5e06daef4041e2006
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

此页定义了规范的 SecretRef 凭证入口面。

范围意图：

- 在范围内：严格限于用户提供、且不由 OpenClaw 签发或轮换的凭证。
- 不在范围内：运行时签发或会轮换的凭证、OAuth 刷新材料，以及类似会话的工件。

## 受支持的凭证

### `openclaw.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` 通过同级 `serviceAccountRef`（兼容性例外）
- `channels.googlechat.accounts.*.serviceAccount` 通过同级 `serviceAccountRef`（兼容性例外）

### `auth-profiles.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；当 `auth.profiles.<id>.mode = "oauth"` 时不受支持）
- `profiles.*.tokenRef`（`type: "token"`；当 `auth.profiles.<id>.mode = "oauth"` 时不受支持）

[//]: # "secretref-supported-list-end"

说明：

- Auth-profile 计划目标需要 `agentId`。
- 计划条目以 `profiles.*.key` / `profiles.*.token` 为目标，并写入同级 ref（`keyRef` / `tokenRef`）。
- Auth-profile refs 已包含在运行时解析和审计覆盖范围内。
- OAuth 策略保护：`auth.profiles.<id>.mode = "oauth"` 不能与该 profile 的 SecretRef 输入组合使用。违反此策略时，启动/重载和 auth-profile 解析都会快速失败。
- 对于由 SecretRef 管理的模型提供商，生成的 `agents/*/agent/models.json` 条目会为 `apiKey`/header 入口面持久化非密钥标记（而不是已解析的密钥值）。
- 标记持久化以源为准：OpenClaw 从当前活动的源配置快照（解析前）写入标记，而不是从已解析的运行时密钥值写入。
- 对于 Web 搜索：
  - 在显式提供商模式下（设置了 `tools.web.search.provider`），只有所选提供商 key 处于活动状态。
  - 在自动模式下（未设置 `tools.web.search.provider`），只有按优先级成功解析的第一个提供商 key 处于活动状态。
  - 在自动模式下，未被选中的提供商 ref 在被选中之前都视为非活动状态。
  - 旧版 `tools.web.search.*` 提供商路径在兼容窗口期内仍会解析，但规范的 SecretRef 入口面是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不受支持的凭证

不在范围内的凭证包括：

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

原因：

- 这些凭证属于已签发、会轮换、携带会话状态，或 OAuth 持久化类别，不适合只读的外部 SecretRef 解析。

## 相关内容

- [密钥管理](/zh-CN/gateway/secrets)
- [认证凭证语义](/zh-CN/auth-credential-semantics)
