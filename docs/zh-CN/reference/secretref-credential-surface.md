---
read_when:
    - 验证 SecretRef 凭证覆盖范围
    - 审查某项凭证是否符合 `secrets configure` 或 `secrets apply` 的适用条件
    - 验证某项凭证为何不在支持范围内
summary: 规范支持与不支持的 SecretRef 凭证范围
title: SecretRef 凭证范围
x-i18n:
    generated_at: "2026-04-06T16:23:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 211f4b504c5808f7790683066fc2c8b700c705c598f220a264daf971b81cc593
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# SecretRef 凭证范围

本页面定义了规范的 SecretRef 凭证范围。

范围说明：

- 在范围内：严格限于由用户提供，且 OpenClaw 不会签发或轮换的凭证。
- 不在范围内：运行时签发或会轮换的凭证、OAuth 刷新材料，以及类似会话的工件。

## 支持的凭证

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
- `channels.googlechat.serviceAccount`，通过同级 `serviceAccountRef`（兼容性例外）
- `channels.googlechat.accounts.*.serviceAccount`，通过同级 `serviceAccountRef`（兼容性例外）

### `auth-profiles.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；当 `auth.profiles.<id>.mode = "oauth"` 时不支持）
- `profiles.*.tokenRef`（`type: "token"`；当 `auth.profiles.<id>.mode = "oauth"` 时不支持）

[//]: # "secretref-supported-list-end"

说明：

- Auth-profile 计划目标需要 `agentId`。
- 计划条目以 `profiles.*.key` / `profiles.*.token` 为目标，并写入同级引用（`keyRef` / `tokenRef`）。
- Auth-profile 引用包含在运行时解析和审计覆盖范围内。
- OAuth 策略保护：`auth.profiles.<id>.mode = "oauth"` 不能与该配置文件的 SecretRef 输入同时使用。违反此策略时，启动/重新加载和 auth-profile 解析都会快速失败。
- 对于由 SecretRef 管理的模型提供商，生成的 `agents/*/agent/models.json` 条目会持久化非机密标记（而不是已解析的机密值），用于 `apiKey`/请求头范围。
- 标记持久化以源配置为权威：OpenClaw 从当前生效的源配置快照（解析前）写入标记，而不是从运行时已解析的机密值写入。
- 对于 Web 搜索：
  - 在显式提供商模式下（已设置 `tools.web.search.provider`），只有所选提供商的键处于活动状态。
  - 在自动模式下（未设置 `tools.web.search.provider`），只有按优先级解析出的第一个提供商键处于活动状态。
  - 在自动模式下，未被选中的提供商引用在被选中之前都视为非活动状态。
  - 旧版 `tools.web.search.*` 提供商路径在兼容窗口期间仍会解析，但规范的 SecretRef 范围是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支持的凭证

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

理由：

- 这些凭证属于签发型、轮换型、会话承载型或 OAuth 持久类，不适合只读的外部 SecretRef 解析。
