---
read_when:
    - SecretRef認証情報カバレッジを検証するとき
    - ある認証情報が `secrets configure` または `secrets apply` の対象かどうかを監査するとき
    - ある認証情報がサポート対象サーフェス外である理由を確認するとき
summary: 正規のサポート対象/非対象のSecretRef認証情報サーフェス
title: SecretRef Credential Surface
x-i18n:
    generated_at: "2026-04-05T12:55:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# SecretRef認証情報サーフェス

このページでは、正規のSecretRef認証情報サーフェスを定義します。

スコープの意図:

- スコープ内: OpenClawが生成もローテーションもしない、厳密にユーザー提供の認証情報。
- スコープ外: ランタイムで生成される、またはローテーションされる認証情報、OAuth refresh素材、およびセッション類似のアーティファクト。

## サポートされる認証情報

### `openclaw.json` の対象（`secrets configure` + `secrets apply` + `secrets audit`）

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
- `plugins.entries.firecrawl.config.webFetch.apiKey`
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
- `channels.googlechat.serviceAccount`（兄弟 `serviceAccountRef` 経由。互換性例外）
- `channels.googlechat.accounts.*.serviceAccount`（兄弟 `serviceAccountRef` 経由。互換性例外）

### `auth-profiles.json` の対象（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`。`auth.profiles.<id>.mode = "oauth"` の場合は非対応）
- `profiles.*.tokenRef`（`type: "token"`。`auth.profiles.<id>.mode = "oauth"` の場合は非対応）

[//]: # "secretref-supported-list-end"

注:

- Auth-profileのplan targetには `agentId` が必要です。
- Plan entryは `profiles.*.key` / `profiles.*.token` を対象とし、兄弟参照（`keyRef` / `tokenRef`）を書き込みます。
- Auth-profile参照は、ランタイム解決とaudit対象範囲に含まれます。
- OAuthポリシーガード: `auth.profiles.<id>.mode = "oauth"` は、そのprofileに対するSecretRef入力と組み合わせられません。このポリシーに違反すると、startup/reloadおよびauth-profile解決は即座に失敗します。
- SecretRef管理のmodel providerでは、生成される `agents/*/agent/models.json` 項目は、`apiKey`/headerサーフェスに対して非シークレットのmarker（解決済みsecret値ではない）を永続化します。
- Markerの永続化はソース権威型です。OpenClawは、解決済みランタイムsecret値からではなく、アクティブなソースconfig snapshot（解決前）からmarkerを書き込みます。
- web searchについて:
  - 明示的provider mode（`tools.web.search.provider` が設定されている）では、選択されたprovider keyだけがアクティブです。
  - auto mode（`tools.web.search.provider` が未設定）では、優先順位に従って最初に解決されたprovider keyだけがアクティブです。
  - auto modeでは、選択されなかったprovider参照は選択されるまで非アクティブとして扱われます。
  - レガシーの `tools.web.search.*` provider pathは互換期間中は引き続き解決されますが、正規のSecretRefサーフェスは `plugins.entries.<plugin>.config.webSearch.*` です。

## サポートされない認証情報

スコープ外の認証情報には次が含まれます。

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

根拠:

- これらの認証情報は、生成されるもの、ローテーションされるもの、セッション保持型のもの、またはOAuth永続クラスであり、読み取り専用の外部SecretRef解決には適合しません。
