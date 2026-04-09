---
read_when:
    - どのSDKサブパスからインポートするべきか知る必要がある
    - OpenClawPluginApi上のすべての登録メソッドのリファレンスが欲しい
    - 特定のSDKエクスポートを調べている
sidebarTitle: SDK Overview
summary: インポートマップ、登録APIリファレンス、SDKアーキテクチャ
title: プラグインSDK概要
x-i18n:
    generated_at: "2026-04-09T01:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf205af060971931df97dca4af5110ce173d2b7c12f56ad7c62d664a402f2381
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# プラグインSDK概要

プラグインSDKは、プラグインとcoreの間にある型付き契約です。このページは、
**何をインポートするか**と**何を登録できるか**のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初のプラグインですか？ [はじめに](/ja-JP/plugins/building-plugins)から始めてください
  - チャネルプラグインですか？ [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)を参照してください
  - プロバイダープラグインですか？ [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)を参照してください
</Tip>

## インポート規約

必ず特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動を高速に保ち、
循環依存の問題を防ぎます。チャネル固有のエントリ / ビルドヘルパーには、
`openclaw/plugin-sdk/channel-core`を優先し、より広い包括的サーフェスと
`buildChannelConfigSchema`のような共有ヘルパーには
`openclaw/plugin-sdk/core`を使用してください。

`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`のような
プロバイダー名付きの便宜的なサーフェスや、
チャネルブランド付きのヘルパーサーフェスを追加したり依存したりしないでください。バンドルプラグインは、
汎用的なSDKサブパスを自分自身の`api.ts`または`runtime-api.ts`バレル内で
組み合わせるべきであり、coreは、それらのプラグインローカルバレルを使うか、
本当にチャネル横断のニーズである場合にのみ、狭く汎用的なSDK
契約を追加するべきです。

生成されたエクスポートマップには、依然として少数のバンドルプラグイン向けヘルパー
サーフェスが含まれています。たとえば`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、
`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*`などです。これらの
サブパスは、バンドルプラグインの保守と互換性のためだけに存在しており、
意図的に以下の共通テーブルからは除外されています。新しいサードパーティ
プラグインに推奨されるインポートパスではありません。

## サブパスリファレンス

用途別にまとめた、最もよく使われるサブパスです。200以上のサブパスからなる
生成済みの完全一覧は`scripts/lib/plugin-sdk-entrypoints.json`にあります。

予約されたバンドルプラグイン向けヘルパーサブパスは、その生成一覧にも引き続き表示されます。
ドキュメントページが明示的に公開として案内していない限り、それらは
実装詳細 / 互換性サーフェスとして扱ってください。

### プラグインエントリ

| サブパス | 主なエクスポート |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="チャネルサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート`openclaw.json` Zodスキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および`DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定 / アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント参照 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭いアカウント一覧 / アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | チャネル設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きのTelegramカスタムコマンド正規化 / 検証ヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有の受信記録 / ディスパッチヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析 / マッチングヘルパー |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信アイデンティティ / 送信デリゲートヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | 古いagent media payloadビルダー |
    | `plugin-sdk/conversation-runtime` | 会話 / スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット / サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭いチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネルプラグイン前奏エクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定編集 / 読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有ダイレクトDM認証 / ガードヘルパー |
    | `plugin-sdk/interactive-runtime` | 対話返信payload正規化 / 縮約ヘルパー |
    | `plugin-sdk/channel-inbound` | 受信デバウンス、メンションマッチング、メンションポリシーヘルパー、およびエンベロープヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | ターゲット解析 / マッチングヘルパー |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック / リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、およびsecret target型などの狭いsecret-contractヘルパー |
  </Accordion>

  <Accordion title="プロバイダーサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル / セルフホスト型プロバイダーのセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換セルフホストプロバイダー向けの焦点を絞ったセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLIバックエンドのデフォルト + watchdog定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダープラグイン向けのランタイムAPIキー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile`などのAPIキーオンボーディング / プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準OAuth auth-resultビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダープラグイン向け共有対話ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数参照ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有replay-policyビルダー、provider-endpointヘルパー、および`normalizeNativeXaiModelId`のようなmodel-id正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダーHTTP / endpoint capabilityヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig`や`WebFetchProviderPlugin`などの狭いweb-fetch設定 / 選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web-fetchプロバイダー登録 / キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | プラグイン有効化配線を必要としないプロバイダー向けの狭いweb-search設定 / 認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびスコープ付き認証情報setter/getterなどの狭いweb-search設定 / 認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | Web-searchプロバイダー登録 / キャッシュ / ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Geminiスキーマクリーンアップ + 診断、および`resolveXaiModelCompatPatch` / `applyXaiModelCompat`のようなxAI互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage`など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper型、および共有のAnthropic / Bedrock / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot wrapperヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルsingleton / map / cacheヘルパー |
  </Accordion>

  <Accordion title="認証およびセキュリティサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、コマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated`や`buildHelpMessage`などのコマンド / ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決および同一チャットaction-authヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブexec承認プロファイル / フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認capability / deliveryアダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認Gateway解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い承認ハンドラーランタイムヘルパー。狭いadapter / gatewayサーフェスで十分な場合はそちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + account-bindingヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec / プラグイン承認返信payloadヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証 + ネイティブsession-targetヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-surface` | コマンド本文正規化およびコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャネル / プラグインsecretサーフェス向けの狭いsecret-contract収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret-contract / 設定解析向けの狭い`coerceSecretRef`およびSecretRef型ヘルパー |
    | `plugin-sdk/security-runtime` | 共有trust、DMゲーティング、外部コンテンツ、secret収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストおよびプライベートネットワークSSRFポリシーヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRFガード付きfetch、およびSSRFポリシーヘルパー |
    | `plugin-sdk/secret-input` | secret入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhookリクエスト / ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ / タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムおよびストレージサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム / ロギング / バックアップ / プラグインインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイム環境、logger、timeout、retry、backoffヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキスト登録 / 参照ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有プラグインコマンド / hook / http / interactiveヘルパー |
    | `plugin-sdk/hook-runtime` | 共有webhook / internal hook pipelineヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface`などの遅延ランタイムインポート / バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセスexecヘルパー |
    | `plugin-sdk/cli-runtime` | CLI整形、待機、バージョンヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアントおよびchannel-statusパッチヘルパー |
    | `plugin-sdk/config-runtime` | 設定読み込み / 書き込みヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルTelegram契約サーフェスが利用できない場合でも使えるTelegramコマンド名 / 説明の正規化と重複 / 競合チェック |
    | `plugin-sdk/approval-runtime` | exec / プラグイン承認ヘルパー、approval-capabilityビルダー、auth / profileヘルパー、ネイティブルーティング / ランタイムヘルパー |
    | `plugin-sdk/reply-runtime` | 共有受信 / 返信ランタイムヘルパー、chunking、dispatch、heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い返信dispatch / finalizeヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled`などの共有短時間窓reply-historyヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いtext / markdown chunkingヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス + updated-atヘルパー |
    | `plugin-sdk/state-paths` | 状態 / OAuthディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`などのルート / session-key / account bindingヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル / アカウントステータスサマリーヘルパー、ランタイム状態デフォルト、およびissueメタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug / 文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch / request風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化済みstdout / stderr結果を伴う時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通tool / CLIパラメーターリーダー |
    | `plugin-sdk/tool-payload` | tool結果オブジェクトから正規化済みpayloadを抽出 |
    | `plugin-sdk/tool-send` | tool引数から標準的な送信ターゲットフィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムloggerおよびマスキングヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdownテーブルモードヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON状態読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能file-lockヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックのdedupe cacheヘルパー |
    | `plugin-sdk/acp-runtime` | ACPランタイム / セッションおよびreply-dispatchヘルパー |
    | `plugin-sdk/agent-config-primitives` | 狭いagentランタイムconfig-schemaプリミティブ |
    | `plugin-sdk/boolean-param` | 緩いbooleanパラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名マッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスbootstrapおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有passive-channel、status、およびambient proxyヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models`コマンド / プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skillコマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ / build / serializeヘルパー |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント / heartbeatヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模な上限制cacheヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグおよびイベントヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、整形、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済みfetch、proxy、およびpinned lookupヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名およびSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | retry設定およびretry runnerヘルパー |
    | `plugin-sdk/agent-runtime` | agent dir / identity / workspaceヘルパー |
    | `plugin-sdk/directory-runtime` | 設定バックディレクトリ問い合わせ / dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="ケイパビリティおよびテストサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディアfetch / transform / storeヘルパーに加え、media payloadビルダー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成failoverヘルパー、候補選択、およびモデル欠落メッセージング |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向け画像 / 音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | assistant-visible-text除去、markdown render / chunking / tableヘルパー、マスキングヘルパー、directive-tagヘルパー、安全なテキストユーティリティなどの共有text / markdown / loggingヘルパー |
    | `plugin-sdk/text-chunking` | 送信text chunkingヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けdirective、registry、validationヘルパー |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、registry、directive、normalizationヘルパー |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型およびregistryヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型およびregistryヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型 |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、failover、auth、およびregistryヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー / リクエスト / 結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、failoverヘルパー、プロバイダー参照、およびmodel-ref解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー / リクエスト / 結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、failoverヘルパー、プロバイダー参照、およびmodel-ref解析 |
    | `plugin-sdk/webhook-targets` | Webhookターゲットレジストリおよびルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhookパス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート / ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | プラグインSDK利用者向けに再エクスポートされた`zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="メモリサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager / config / file / CLIヘルパー向けのバンドルmemory-coreヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリindex / searchランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリhost foundation engineエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリhost embedding engineエクスポート |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリhost QMD engineエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリhost storage engineエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリhostマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリhost queryヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリhost secretヘルパー |
    | `plugin-sdk/memory-core-host-events` | メモリhostイベントジャーナルヘルパー |
    | `plugin-sdk/memory-core-host-status` | メモリhostステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリhost CLIランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリhost coreランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリhost file / ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリhost coreランタイムヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリhostイベントジャーナルヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | メモリhost file / ランタイムヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接プラグイン向け共有managed-markdownヘルパー |
    | `plugin-sdk/memory-host-search` | search-managerアクセス向けのアクティブメモリランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリhostステータスヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドルmemory-lancedbヘルパーサーフェス |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    | ファミリー | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドルbrowserプラグイン向けサポートヘルパー（`browser-support`は互換性バレルとして維持） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドルMatrixヘルパー / ランタイムサーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドルLINEヘルパー / ランタイムサーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドルIRCヘルパーサーフェス |
    | チャネル固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドルチャネル互換性 / ヘルパーサーフェス |
    | 認証 / プラグイン固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドル機能 / プラグインヘルパーサーフェス。`plugin-sdk/github-copilot-token`は現在`DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken`をエクスポートします |
  </Accordion>
</AccordionGroup>

## 登録API

`register(api)`コールバックは、以下のメソッドを持つ`OpenClawPluginApi`オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド | 登録するもの |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）             |
| `api.registerCliBackend(...)`                    | ローカルCLI推論バックエンド      |
| `api.registerChannel(...)`                       | メッセージングチャネル                |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT合成   |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングのリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション   |
| `api.registerMediaUnderstandingProvider(...)`    | 画像 / 音声 / 動画解析       |
| `api.registerImageGenerationProvider(...)`       | 画像生成                 |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                 |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                 |
| `api.registerWebFetchProvider(...)`              | Web fetch / スクレイププロバイダー      |
| `api.registerWebSearchProvider(...)`             | Web検索                       |

### ツールとコマンド

| メソッド | 登録するもの |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | agentツール（必須、または`{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLMをバイパスする）             |

### インフラストラクチャ

| メソッド | 登録するもの |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントhook                              |
| `api.registerHttpRoute(params)`                | Gateway HTTPエンドポイント                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPCメソッド                      |
| `api.registerCli(registrar, opts?)`            | CLIサブコマンド                          |
| `api.registerService(service)`                 | バックグラウンドサービス                      |
| `api.registerInteractiveHandler(registration)` | interactive handler                     |
| `api.registerMemoryPromptSupplement(builder)`  | 加算的なメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加算的なメモリ検索 / 読み取りコーパス      |

予約済みのcore管理名前空間（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は、プラグインがより狭いGatewayメソッドスコープを割り当てようとしても、
常に`operator.admin`のままです。
プラグイン所有メソッドには、プラグイン固有の接頭辞を優先してください。

### CLI登録メタデータ

`api.registerCli(registrar, opts?)`は、2種類のトップレベルメタデータを受け取ります。

- `commands`: registrarが所有する明示的なコマンドルート
- `descriptors`: ルートCLIヘルプ、
  ルーティング、および遅延プラグインCLI登録で使われる解析時コマンド記述子

プラグインコマンドを通常のルートCLIパスで遅延読み込みのままにしたい場合は、
そのregistrarが公開するすべてのトップレベルコマンドルートをカバーする
`descriptors`を提供してください。

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

通常のルートCLI登録で遅延読み込みが不要な場合にのみ、
`commands`を単独で使用してください。
この即時互換パスは引き続きサポートされていますが、解析時の遅延読み込みのための
descriptorバックのプレースホルダーはインストールしません。

### CLIバックエンド登録

`api.registerCliBackend(...)`を使うと、`codex-cli`のようなローカル
AI CLIバックエンドのデフォルト設定をプラグインが所有できます。

- バックエンドの`id`は、`codex-cli/gpt-5`のようなmodel ref内のプロバイダー接頭辞になります。
- バックエンド`config`は、`agents.defaults.cliBackends.<id>`と同じ形状を使用します。
- ユーザー設定が常に優先されます。OpenClawはCLI実行前に、プラグインのデフォルトの上へ
  `agents.defaults.cliBackends.<id>`をマージします。
- マージ後にバックエンドが互換性書き換えを必要とする場合は`normalizeConfig`を使用してください
  （たとえば古いフラグ形状の正規化など）。

### 排他的スロット

| メソッド | 登録するもの |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に1つだけアクティブ）。`assemble()`コールバックは`availableTools`と`citationsMode`を受け取るため、エンジンはそれに応じてプロンプト追加を調整できます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリケイパビリティ                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | メモリflush planリゾルバー                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                    |

### メモリ埋め込みアダプター

| メソッド | 登録するもの |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブなプラグイン向けのメモリ埋め込みアダプター |

- `registerMemoryCapability`は、推奨される排他的メモリプラグインAPIです。
- `registerMemoryCapability`は`publicArtifacts.listArtifacts(...)`も公開できるため、
  コンパニオンプラグインは特定のメモリプラグインの非公開レイアウトに入り込むのではなく、
  `openclaw/plugin-sdk/memory-host-core`経由でエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime`は、古い互換性のある排他的メモリプラグインAPIです。
- `registerMemoryEmbeddingProvider`を使うと、アクティブなメモリプラグインは1つ以上の
  埋め込みアダプターID（たとえば`openai`、`gemini`、またはカスタムの
  プラグイン定義ID）を登録できます。
- `agents.defaults.memorySearch.provider`や
  `agents.defaults.memorySearch.fallback`のようなユーザー設定は、
  それらの登録済みアダプターIDに対して解決されます。

### イベントとライフサイクル

| メソッド | 役割 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルhook          |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

### Hook判定セマンティクス

- `before_tool_call`: `{ block: true }`を返すと終端です。いずれかのハンドラーがこれを設定すると、より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }`を返しても判定なしとして扱われます（`block`を省略した場合と同じ）であり、上書きではありません。
- `before_install`: `{ block: true }`を返すと終端です。いずれかのハンドラーがこれを設定すると、より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }`を返しても判定なしとして扱われます（`block`を省略した場合と同じ）であり、上書きではありません。
- `reply_dispatch`: `{ handled: true, ... }`を返すと終端です。いずれかのハンドラーがdispatchを引き受けると、より低優先度のハンドラーとデフォルトのモデルdispatchパスはスキップされます。
- `message_sending`: `{ cancel: true }`を返すと終端です。いずれかのハンドラーがこれを設定すると、より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }`を返しても判定なしとして扱われます（`cancel`を省略した場合と同じ）であり、上書きではありません。

### APIオブジェクトのフィールド

| フィールド | 型 | 説明 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | プラグインID                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                |
| `api.version`            | `string?`                 | プラグインバージョン（任意）                                                                   |
| `api.description`        | `string?`                 | プラグイン説明（任意）                                                               |
| `api.source`             | `string`                  | プラグインソースパス                                                                          |
| `api.rootDir`            | `string?`                 | プラグインルートディレクトリ（任意）                                                            |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`からのプラグイン固有設定                                   |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | スコープ付きlogger（`debug`, `info`, `warn`, `error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"`は、完全なエントリ起動 / セットアップ前の軽量ウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | プラグインルート相対でパスを解決する                                                        |

## 内部モジュール規約

プラグイン内部では、内部インポートにローカルバレルファイルを使用してください。

```
my-plugin/
  api.ts            # 外部利用者向け公開エクスポート
  runtime-api.ts    # 内部専用ランタイムエクスポート
  index.ts          # プラグインエントリポイント
  setup-entry.ts    # 軽量セットアップ専用エントリ（任意）
```

<Warning>
  本番コードから、自分自身のプラグインを`openclaw/plugin-sdk/<your-plugin>`
  経由でインポートしてはいけません。内部インポートは`./api.ts`または
  `./runtime-api.ts`経由にしてください。SDKパスは外部契約専用です。
</Warning>

ファサード読み込みのバンドルプラグイン公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および類似の公開エントリファイル）は、現在、
OpenClawがすでに実行中であればアクティブなランタイム設定スナップショットを優先します。
まだランタイムスナップショットが存在しない場合は、ディスク上の解決済み設定ファイルへフォールバックします。

プロバイダープラグインは、ヘルパーが意図的にプロバイダー固有で、
まだ汎用SDKサブパスに属さない場合に、狭いプラグインローカル契約バレルを公開することもできます。
現在のバンドル例: Anthropicプロバイダーは、Anthropicのbeta-headerと
`service_tier`ロジックを汎用`plugin-sdk/*`契約へ昇格させる代わりに、
Claude streamヘルパーを独自の公開`api.ts` / `contract-api.ts`サーフェスに保持しています。

現在のその他のバンドル例:

- `@openclaw/openai-provider`: `api.ts`はプロバイダービルダー、
  default-modelヘルパー、およびリアルタイムプロバイダービルダーをエクスポートします
- `@openclaw/openrouter-provider`: `api.ts`はプロバイダービルダーに加えて
  オンボーディング / 設定ヘルパーをエクスポートします

<Warning>
  拡張機能の本番コードも、`openclaw/plugin-sdk/<other-plugin>`の
  インポートを避けるべきです。ヘルパーが本当に共有されるべきものであれば、
  2つのプラグインを結合してしまうのではなく、`openclaw/plugin-sdk/speech`、
  `.../provider-model-shared`、または別の
  ケイパビリティ指向サーフェスのような中立的なSDKサブパスへ昇格してください。
</Warning>

## 関連

- [Entry Points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry`と`defineChannelPluginEntry`のオプション
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — `api.runtime`名前空間の完全リファレンス
- [Setup and Config](/ja-JP/plugins/sdk-setup) — パッケージング、マニフェスト、設定スキーマ
- [Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティとlintルール
- [SDK Migration](/ja-JP/plugins/sdk-migration) — 非推奨サーフェスからの移行
- [Plugin Internals](/ja-JP/plugins/architecture) — 詳細なアーキテクチャとケイパビリティモデル
