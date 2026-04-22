---
read_when:
    - どのSDKサブパスからimportすべきかを知る必要がある場合
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが欲しい場合
    - 特定のSDKエクスポートを調べている場合
sidebarTitle: SDK Overview
summary: import map、登録APIリファレンス、SDKアーキテクチャ
title: Plugin SDK概要
x-i18n:
    generated_at: "2026-04-22T04:26:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK概要

Plugin SDKは、Pluginとコアの間にある型付き契約です。このページは、**何をimportするか** と **何を登録できるか** のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初のPluginなら、[はじめに](/ja-JP/plugins/building-plugins) から始めてください
  - Channel Pluginなら、[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください
  - Provider Pluginなら、[Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください
</Tip>

## import規約

必ず特定のサブパスからimportしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、
循環依存の問題も防げます。チャネル固有のエントリ/ビルドヘルパーでは、
`openclaw/plugin-sdk/channel-core` を優先し、`openclaw/plugin-sdk/core` は
より広いアンブレラサーフェスや `buildChannelConfigSchema` のような共有ヘルパー向けに使ってください。

`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp` のような、
プロバイダー名付きの便宜的な継ぎ目や、チャネルブランド付きのヘルパー継ぎ目を
追加したり依存したりしないでください。バンドルされたPluginは、汎用的な
SDKサブパスを自前の `api.ts` または `runtime-api.ts` バレルの中で構成するべきであり、コアは
それらのPluginローカルバレルを使うか、必要が本当にチャネル横断的な場合にのみ
狭い汎用SDK契約を追加するべきです。

生成されたエクスポートマップには、`plugin-sdk/feishu`、
`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、
`plugin-sdk/matrix*` のような、少数のバンドルPluginヘルパー継ぎ目がまだ含まれています。これらの
サブパスは、バンドルPluginの保守および互換性のために存在しているだけであり、
下の一般的な表からは意図的に省かれていて、新しいサードパーティPlugin向けの
推奨importパスではありません。

## サブパスリファレンス

用途ごとにグループ化した、最もよく使われるサブパスです。200以上ある完全な生成済み一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約済みのバンドルPluginヘルパーサブパスは、その生成済み一覧には引き続き現れます。
ドキュメントページで明示的に公開APIとして案内されていない限り、それらは
実装詳細/互換性サーフェスとして扱ってください。

### Pluginエントリ

| サブパス | 主なエクスポート |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry` |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema` |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

<AccordionGroup>
  <Accordion title="チャネルサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zodスキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有setupウィザードヘルパー、許可リストプロンプト、setupステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウントconfig/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウントID正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭いアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | チャネルconfigスキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きのTelegramカスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 狭いコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、ドラフトストリームのライフサイクル/完了ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有受信記録およびディスパッチヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/一致ヘルパー |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信identity、送信デリゲート、ペイロード計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 狭い投票正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドbindingのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーのエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドbinding、ペアリング、設定済みbindingヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイムconfigスナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムgroup policy解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット/サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭いチャネルconfigスキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネルconfig書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネルPluginプレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リストconfig編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有ダイレクトDM認証/ガードヘルパー |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージプレゼンテーション、配信、レガシー対話返信ヘルパー。[Message Presentation](/ja-JP/plugins/message-presentation) を参照 |
    | `plugin-sdk/channel-inbound` | 受信デバウンス、メンション一致、メンションポリシーヘルパー、およびエンベロープヘルパー用の互換バレル |
    | `plugin-sdk/channel-mention-gating` | より広い受信ランタイムサーフェスを含まない、狭いメンションポリシーヘルパー |
    | `plugin-sdk/channel-location` | チャネル位置コンテキストおよびフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップおよびtyping/ack失敗向けのチャネルロギングヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパー。加えて、Plugin互換性のために保持された非推奨ネイティブスキーマヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析/一致ヘルパー |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、secretターゲット型などの狭いsecret契約ヘルパー |
  </Accordion>

  <Accordion title="プロバイダーサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーsetupヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換のセルフホスト型プロバイダー向けの集中したsetupヘルパー |
    | `plugin-sdk/cli-backend` | CLIバックエンドデフォルト + watchdog定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダーPlugin向けランタイムAPIキー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` のようなAPIキーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準OAuth auth-resultビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダーPlugin向け共有対話ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証env var検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay policyビルダー、プロバイダーエンドポイントヘルパー、および `normalizeNativeXaiModelId` のようなモデルID正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダーHTTP/エンドポイント機能ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` のような、狭いweb-fetch config/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetchプロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin有効化配線を必要としないプロバイダー向けの、狭いweb-search config/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報setter/getter などの狭いweb-search config/認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | web-searchプロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Geminiスキーマクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI 互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共有Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message変換、書き込み可能transport event stream などのネイティブプロバイダーtransportヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディングconfigパッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのsingleton/map/cacheヘルパー |
  </Accordion>

  <Accordion title="認証およびセキュリティサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、コマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` のようなコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決および同一chatアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブexec承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認gateway解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットなチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い承認ハンドラーランタイムヘルパー。狭いアダプター/gatewayの継ぎ目で足りる場合はそちらを優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントbindingヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin承認返信ペイロードヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証 + ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-surface` | コマンド本文正規化およびコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャネル/Plugin secretサーフェス向けの狭いsecret契約収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret契約/config解析向けの狭い `coerceSecretRef` と SecretRef 型ヘルパー |
    | `plugin-sdk/security-runtime` | 共有trust、DM gating、外部コンテンツ、secret収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストおよびプライベートネットワークSSRFポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | より広いinfraランタイムサーフェスを含まない、狭いpinned dispatcherヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned dispatcher、SSRFガード付きfetch、およびSSRFポリシーヘルパー |
    | `plugin-sdk/secret-input` | secret入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhookリクエスト/ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエストボディサイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムおよびストレージサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイムenv、ロガー、タイムアウト、再試行、バックオフヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキスト登録および検索ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Pluginコマンド/フック/http/対話ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` のような遅延ランタイムimport/bindingヘルパー |
    | `plugin-sdk/process-runtime` | プロセスexecヘルパー |
    | `plugin-sdk/cli-runtime` | CLIフォーマット、待機、バージョンヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアントおよびチャネルステータスパッチヘルパー |
    | `plugin-sdk/config-runtime` | config読み込み/書き込みヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされたTelegram契約サーフェスが利用できない場合でも使える、Telegramコマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | より広いtext-runtimeバレルを含まないファイル参照autolink検出 |
    | `plugin-sdk/approval-runtime` | exec/plugin承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー |
    | `plugin-sdk/reply-runtime` | 共有受信/返信ランタイムヘルパー、chunking、dispatch、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い返信dispatch/finalizeヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` のような共有短期ウィンドウ返信履歴ヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いテキスト/Markdown chunkingヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアのパス + updated-atヘルパー |
    | `plugin-sdk/state-paths` | State/OAuthディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` のようなルート/セッションキー/アカウントbindingヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータスサマリーヘルパー、ランタイム状態デフォルト、issueメタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化済みstdout/stderr結果を返すタイムドコマンドランナー |
    | `plugin-sdk/param-readers` | 共通tool/CLIパラメーターリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化済みペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信ターゲットフィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムロガーおよびリダクションヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown表モードヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON state読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックdペ重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACPランタイム/セッションおよび返信dispatchヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動importを伴わない読み取り専用ACP binding解決 |
    | `plugin-sdk/agent-config-primitives` | 狭いエージェントランタイムconfigスキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩いbooleanパラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名一致解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスbootstrapおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャネル、ステータス、ambient proxyヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skillコマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリの構築/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的trusted-pluginサーフェス: harness型、アクティブ実行のsteer/abortヘルパー、OpenClawツールブリッジヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.Iエンドポイント検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/Heartbeatヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模な有界キャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグおよびイベントヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済みfetch、proxy、およびpinned lookupヘルパー |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch importなしのdispatcher対応ランタイムfetch |
    | `plugin-sdk/response-limit-runtime` | より広いmediaランタイムサーフェスを含まない有界レスポンスボディリーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みbindingルーティングやペアリングストアを含まない現在の会話binding状態 |
    | `plugin-sdk/session-store-runtime` | より広いconfig書き込み/保守importを含まないセッションストア読み取りヘルパー |
    | `plugin-sdk/context-visibility-runtime` | より広いconfig/security importを含まないコンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングimportを含まない狭いプリミティブrecord/文字列強制変換および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名およびSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | 再試行configおよび再試行ランナーヘルパー |
    | `plugin-sdk/agent-runtime` | エージェントディレクトリ/identity/workspaceヘルパー |
    | `plugin-sdk/directory-runtime` | configバックのディレクトリ問い合わせ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能およびテスト用サブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディアfetch/変換/保存ヘルパーに加え、メディアペイロードビルダー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、不足モデルメッセージング |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型に加え、プロバイダー向け画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | assistant可視テキスト除去、Markdownレンダリング/chunking/表ヘルパー、リダクションヘルパー、ディレクティブタグヘルパー、安全テキストユーティリティなどの共有テキスト/Markdown/ロギングヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストchunkingヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型に加え、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化ヘルパー |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型およびレジストリヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型およびレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型 |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、model-ref解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、model-ref解析 |
    | `plugin-sdk/webhook-targets` | Webhookターゲットレジストリおよびルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhookパス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | Plugin SDK利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memoryサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLIヘルパー向けの、バンドルされたmemory-coreヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホストfoundation engineエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホストembedding契約、レジストリアクセス、ローカルプロバイダー、および汎用batch/remoteヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホストQMD engineエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストstorage engineエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストmultimodalヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストqueryヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホストsecretヘルパー |
    | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホストCLIランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接Plugin向けの共有managed-markdownヘルパー |
    | `plugin-sdk/memory-host-search` | 検索managerアクセス向けのActive Memoryランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリホストステータスヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドルされたmemory-lancedbヘルパーサーフェス |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    | ファミリー | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドルされたbrowser Plugin支援ヘルパー（`browser-support` は互換バレルのまま） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドルされたMatrixヘルパー/ランタイムサーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドルされたLINEヘルパー/ランタイムサーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドルされたIRCヘルパーサーフェス |
    | チャネル固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドルされたチャネル互換/ヘルパー継ぎ目 |
    | 認証/Plugin固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドルされた機能/Pluginヘルパー継ぎ目。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` をエクスポートします |
  </Accordion>
</AccordionGroup>

## 登録API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### capability登録

| メソッド | 登録するもの |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM） |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器 |
| `api.registerCliBackend(...)`                    | ローカルCLI推論バックエンド |
| `api.registerChannel(...)`                       | メッセージングチャネル |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT合成 |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析 |
| `api.registerImageGenerationProvider(...)`       | 画像生成 |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成 |
| `api.registerVideoGenerationProvider(...)`       | 動画生成 |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrapeプロバイダー |
| `api.registerWebSearchProvider(...)`             | Web検索 |

### ツールとコマンド

| メソッド | 登録するもの |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須、または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLMをバイパス） |

### インフラストラクチャ

| メソッド | 登録するもの |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック |
| `api.registerHttpRoute(params)`                | Gateway HTTPエンドポイント |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPCメソッド |
| `api.registerCli(registrar, opts?)`            | CLIサブコマンド |
| `api.registerService(service)`                 | バックグラウンドサービス |
| `api.registerInteractiveHandler(registration)` | 対話ハンドラー |
| `api.registerMemoryPromptSupplement(builder)`  | 加算的なメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加算的なメモリ検索/読み取りコーパス |

予約済みコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）は、Pluginがより狭いgateway method scopeを割り当てようとしても、
常に `operator.admin` のままです。Plugin所有メソッドには、Plugin固有の接頭辞を
推奨します。

### CLI登録メタデータ

`api.registerCli(registrar, opts?)` は、2種類のトップレベルメタデータを受け付けます。

- `commands`: そのregistrarが所有する明示的なコマンドルート
- `descriptors`: ルートCLIヘルプ、
  ルーティング、および遅延Plugin CLI登録に使われる、パース時のコマンドdescriptor

Pluginコマンドを通常のルートCLIパスで遅延読み込みのままにしたい場合は、
そのregistrarが公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を
提供してください。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrixアカウント、認証、デバイス、プロファイル状態を管理",
        hasSubcommands: true,
      },
    ],
  },
);
```

ルートCLIの遅延登録が不要な場合にのみ、`commands` 単独を使ってください。
その eager 互換パスは引き続きサポートされていますが、パース時の遅延読み込み向けの
descriptorバックプレースホルダーはインストールしません。

### CLIバックエンド登録

`api.registerCliBackend(...)` により、Pluginは `codex-cli` のようなローカル
AI CLIバックエンドのデフォルトconfigを所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のようなmodel ref内のプロバイダー接頭辞になります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザーconfigが引き続き優先されます。OpenClawは、CLI実行前に
  `agents.defaults.cliBackends.<id>` をPluginデフォルトの上にマージします。
- バックエンドが、マージ後に互換性書き換えを必要とする場合（たとえば古いflag形状の正規化）は、
  `normalizeConfig` を使ってください。

### 排他的スロット

| メソッド | 登録するもの |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に1つだけ有効）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取るため、エンジンはそれに応じてプロンプト追加を調整できます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリcapability |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー |
| `api.registerMemoryFlushPlan(resolver)`    | メモリflush planリゾルバー |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター |

### メモリembeddingアダプター

| メソッド | 登録するもの |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブPlugin向けのメモリembeddingアダプター |

- `registerMemoryCapability` は、推奨される排他的メモリPlugin APIです。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、
  連携Pluginは、特定のメモリPluginのprivateレイアウトへ踏み込む代わりに、
  `openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリPlugin APIです。
- `registerMemoryEmbeddingProvider` により、アクティブなメモリPluginは
  1つ以上のembeddingアダプターID（たとえば `openai`、`gemini`、またはPlugin定義のカスタムID）を登録できます。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` のようなユーザーconfigは、
  それらの登録済みアダプターIDに対して解決されます。

### イベントとライフサイクル

| メソッド | 動作 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック |
| `api.onConversationBindingResolved(handler)` | 会話bindingコールバック |

### フック判定の意味論

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、それより優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返しても未決定として扱われます（`block` を省略した場合と同じ）ので、上書きにはなりません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、それより優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返しても未決定として扱われます（`block` を省略した場合と同じ）ので、上書きにはなりません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを引き受けると、それより優先度の低いハンドラーとデフォルトのモデルディスパッチ経路はスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、それより優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返しても未決定として扱われます（`cancel` を省略した場合と同じ）ので、上書きにはなりません。

### APIオブジェクトのフィールド

| フィールド | 型 | 説明 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id |
| `api.name`               | `string`                  | 表示名 |
| `api.version`            | `string?`                 | Pluginバージョン（任意） |
| `api.description`        | `string?`                 | Plugin説明（任意） |
| `api.source`             | `string`                  | Pluginソースパス |
| `api.rootDir`            | `string?`                 | Pluginルートディレクトリ（任意） |
| `api.config`             | `OpenClawConfig`          | 現在のconfigスナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からのPlugin固有config |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`, `info`, `warn`, `error`） |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は、フルエントリ前の軽量な起動/setupウィンドウ |
| `api.resolvePath(input)` | `(string) => string`      | Pluginルートからの相対パスを解決 |

## 内部モジュール規約

Plugin内部では、内部importにローカルバレルファイルを使ってください。

```
my-plugin/
  api.ts            # 外部利用者向け公開エクスポート
  runtime-api.ts    # 内部専用ランタイムエクスポート
  index.ts          # Pluginエントリポイント
  setup-entry.ts    # 軽量なsetup専用エントリ（任意）
```

<Warning>
  本番コードから自分自身のPluginを `openclaw/plugin-sdk/<your-plugin>`
  経由でimportしてはいけません。内部importは `./api.ts` または
  `./runtime-api.ts` を経由させてください。SDKパスは外部契約専用です。
</Warning>

ファサード経由で読み込まれるバンドルPluginの公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、OpenClawが
すでに動作中であれば、現在のランタイムconfigスナップショットを優先するようになりました。
まだランタイムスナップショットが存在しない場合は、ディスク上の解決済みconfigファイルにフォールバックします。

Provider Pluginは、ヘルパーが意図的にプロバイダー固有で、まだ汎用SDK
サブパスに属さない場合、狭いPluginローカル契約バレルを公開することもできます。現在の
バンドル例: Anthropicプロバイダーは、Anthropicのbeta-headerや `service_tier` ロジックを
汎用 `plugin-sdk/*` 契約へ昇格させるのではなく、自身の公開 `api.ts` / `contract-api.ts` 継ぎ目に
Claudeストリームヘルパーを保持しています。

その他の現在のバンドル例:

- `@openclaw/openai-provider`: `api.ts` は、プロバイダービルダー、
  default-modelヘルパー、realtimeプロバイダービルダーをエクスポートします
- `@openclaw/openrouter-provider`: `api.ts` は、プロバイダービルダーに加え
  オンボーディング/configヘルパーをエクスポートします

<Warning>
  extension本番コードでも、`openclaw/plugin-sdk/<other-plugin>`
  importは避けるべきです。ヘルパーが本当に共有されるべきなら、2つのPluginを結合する代わりに、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または他の
  capability指向サーフェスのような中立的なSDKサブパスへ昇格させてください。
</Warning>

## 関連

- [エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry` のオプション
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) — `api.runtime` 名前空間の完全リファレンス
- [Setup and Config](/ja-JP/plugins/sdk-setup) — パッケージング、マニフェスト、configスキーマ
- [テスト](/ja-JP/plugins/sdk-testing) — テストユーティリティとlintルール
- [SDK移行](/ja-JP/plugins/sdk-migration) — 非推奨サーフェスからの移行
- [Plugin内部構造](/ja-JP/plugins/architecture) — 詳細なアーキテクチャとcapabilityモデル
