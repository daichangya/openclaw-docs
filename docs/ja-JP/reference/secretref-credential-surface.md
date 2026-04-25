---
read_when:
    - SecretRef認証情報の対応範囲を確認する場合
    - ある認証情報が`secrets configure`または`secrets apply`の対象かどうかを監査する場合
    - ある認証情報がサポート対象外サーフェスにある理由を確認する場合
summary: 正規のサポート済み / 非サポートのSecretRef認証情報サーフェス
title: SecretRef認証情報サーフェス
x-i18n:
    generated_at: "2026-04-25T13:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50a4602939970d92831c0de9339e84b0f42b119c2e25ea30375925282f55d237
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

このページでは、正規のSecretRef認証情報サーフェスを定義します。

スコープの意図:

- スコープ内: OpenClawが発行またはローテーションしない、厳密にユーザー提供の認証情報。
- スコープ外: ランタイムで発行される、またはローテーションされる認証情報、OAuth refresh素材、セッションのような成果物。

## サポートされる認証情報

### `openclaw.json`ターゲット（`secrets configure` + `secrets apply` + `secrets audit`）

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
- `channels.googlechat.serviceAccount`（互換性例外として兄弟の`serviceAccountRef`経由）
- `channels.googlechat.accounts.*.serviceAccount`（互換性例外として兄弟の`serviceAccountRef`経由）

### `auth-profiles.json`ターゲット（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"`の場合は非対応）
- `profiles.*.tokenRef`（`type: "token"`; `auth.profiles.<id>.mode = "oauth"`の場合は非対応）

[//]: # "secretref-supported-list-end"

注:

- Auth-profile planターゲットには`agentId`が必要です。
- Plan entryは`profiles.*.key` / `profiles.*.token`を対象にし、兄弟ref（`keyRef` / `tokenRef`）を書き込みます。
- Auth-profile refはランタイム解決および監査対象に含まれます。
- `openclaw.json`では、SecretRefは`{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`のような構造化オブジェクトを使う必要があります。レガシーな`secretref-env:<ENV_VAR>`マーカー文字列は、SecretRef認証情報パスでは拒否されます。有効なマーカーを移行するには`openclaw doctor --fix`を実行してください。
- OAuthポリシーガード: `auth.profiles.<id>.mode = "oauth"`は、そのprofileに対するSecretRef入力と組み合わせられません。このポリシーに違反すると、起動/リロードとauth-profile解決は即時に失敗します。
- SecretRef管理のmodel providerでは、生成された`agents/*/agent/models.json`エントリは、`apiKey`/headerサーフェスに対して、解決済みシークレット値ではなく非シークレットマーカーを保持します。
- マーカーの永続化はソースを正とします。OpenClawは、解決済みランタイム秘密値ではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。
- web検索について:
  - 明示的providerモード（`tools.web.search.provider`が設定済み）では、選択されたprovider keyだけがアクティブです。
  - 自動モード（`tools.web.search.provider`未設定）では、優先順位で解決された最初のprovider keyだけがアクティブです。
  - 自動モードでは、未選択provider refは選択されるまで非アクティブとして扱われます。
  - レガシーな`tools.web.search.*` providerパスも互換期間中は引き続き解決されますが、正規のSecretRefサーフェスは`plugins.entries.<plugin>.config.webSearch.*`です。

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

理由:

- これらの認証情報は、発行される、ローテーションされる、セッションを保持する、またはOAuth永続クラスであり、読み取り専用の外部SecretRef解決には適合しません。

## 関連

- [Secrets management](/ja-JP/gateway/secrets)
- [Auth credential semantics](/ja-JP/auth-credential-semantics)
