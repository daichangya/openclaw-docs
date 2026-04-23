---
read_when:
    - どの SDK サブパスから import すべきかを知る必要がある場合
    - OpenClawPluginApi 上のすべての登録メソッドのリファレンスが必要な場合
    - 特定の SDK export を調べている場合
sidebarTitle: SDK Overview
summary: インポートマップ、登録 API リファレンス、および SDK アーキテクチャ
title: Plugin SDK 概要
x-i18n:
    generated_at: "2026-04-23T04:48:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK 概要

Plugin SDK は、Plugin とコアの間の型付きコントラクトです。このページは、
**何を import するか** と **何を登録できるか** のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初の Plugin？ [はじめに](/ja-JP/plugins/building-plugins) から始めてください
  - Channel Plugin？ [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください
  - Provider Plugin？ [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください
</Tip>

## import 規約

必ず特定のサブパスから import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは小さく自己完結したモジュールです。これにより起動を高速に保ち、
循環依存の問題を防げます。Channel 固有のエントリ/ビルドヘルパーについては、
`openclaw/plugin-sdk/channel-core` を優先し、より広い傘となるサーフェスや
`buildChannelConfigSchema` のような共有ヘルパーには
`openclaw/plugin-sdk/core` を使ってください。

`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp` のような
provider 名付きの便利サーフェスや、channel ブランド付きヘルパーサーフェスを追加したり依存したりしてはいけません。バンドル済み Plugin は、汎用
SDK サブパスを自分たちの `api.ts` または `runtime-api.ts` バレル内で構成するべきであり、コアはそれらの Plugin ローカルバレルを使うか、本当に cross-channel な必要がある場合にのみ狭い汎用 SDK
コントラクトを追加するべきです。

生成された export map には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、
`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような、少数のバンドル済み Plugin ヘルパーサーフェスも引き続き含まれています。これらの
サブパスはバンドル済み Plugin の保守と互換性のためだけに存在しており、以下の共通テーブルからは意図的に省かれているため、新しいサードパーティ Plugin に推奨される import パスではありません。

## サブパスリファレンス

目的別にグループ化した、最もよく使われるサブパスです。200 を超えるサブパスの生成済み完全一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約されたバンドル済み Plugin ヘルパーサブパスも、その生成一覧には引き続き現れます。
ドキュメントページで明示的に公開として推奨されていない限り、これらは実装詳細/互換性サーフェスとして扱ってください。

### Plugin エントリ

| サブパス                     | 主要 export                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | サブパス | 主要 export |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ export（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、allowlist プロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウントの設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭い account-list/account-action ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドル済みコントラクト fallback を伴う Telegram カスタムコマンドの正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 狭いコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、draft stream のライフサイクル/完了ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有の受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有の受信 record-and-dispatch ヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/マッチングヘルパー |
    | `plugin-sdk/outbound-media` | 共有の送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信 identity、send delegate、payload planning ヘルパー |
    | `plugin-sdk/poll-runtime` | 狭い poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプタヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーな agent media payload ビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、pairing、configured-binding ヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイム group-policy 解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有 Channel ステータススナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭い Channel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | Channel config-write 認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有 Channel Plugin プレリュード export |
    | `plugin-sdk/allowlist-config-edit` | allowlist 設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有 group-access 判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有 direct-DM auth/guard ヘルパー |
    | `plugin-sdk/interactive-runtime` | セマンティックなメッセージ提示、配信、およびレガシー interactive reply ヘルパー。[Message Presentation](/ja-JP/plugins/message-presentation) を参照 |
    | `plugin-sdk/channel-inbound` | inbound debounce、mention matching、mention-policy ヘルパー、および envelope helper 用の互換バレル |
    | `plugin-sdk/channel-mention-gating` | より広い inbound runtime サーフェスを含まない狭い mention-policy ヘルパー |
    | `plugin-sdk/channel-location` | Channel location コンテキストと整形ヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップや typing/ack 失敗用の Channel ロギングヘルパー |
    | `plugin-sdk/channel-send-result` | reply result 型 |
    | `plugin-sdk/channel-actions` | Channel message-action ヘルパー。加えて Plugin 互換性のために維持される非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析/マッチングヘルパー |
    | `plugin-sdk/channel-contract` | Channel コントラクト型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクションの配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、および secret target 型のような狭い secret-contract ヘルパー |
  </Accordion>

  <Accordion title="Provider subpaths">
    | サブパス | 主要 export |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト Provider セットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホスト Provider 向けの特化セットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 用のランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` のような API キーのオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth auth-result ビルダー |
    | `plugin-sdk/provider-auth-login` | Provider Plugin 用の共有 interactive login ヘルパー |
    | `plugin-sdk/provider-env-vars` | Provider auth 環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有 replay-policy ビルダー、provider-endpoint ヘルパー、および `normalizeNativeXaiModelId` のような model-id 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 音声文字起こし multipart form helper を含む、汎用 provider HTTP/endpoint capability ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` のような狭い web-fetch 設定/選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider の登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化の配線を必要としない Provider 用の狭い web-search 設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、およびスコープ付き認証情報 setter/getter のような狭い web-search 設定/認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | web-search provider の登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini スキーマのクリーンアップ + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI 互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper 型、および共有 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message transform、書き込み可能な transport event stream のようなネイティブ provider transport ヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルの singleton/map/cache ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主要 export |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、コマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` のようなコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | approver 解決と同一チャット action-auth ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認 capability/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有の承認 gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットな Channel エントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い承認 handler ランタイムヘルパー。狭い adapter/gateway サーフェスで十分ならそちらを優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認 target + account-binding ヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認 reply payload ヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証 + ネイティブ session-target ヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-surface` | command-body 正規化と command-surface ヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Channel/Plugin secret サーフェス向けの狭い secret-contract 収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config 解析向けの狭い `coerceSecretRef` と SecretRef 型ヘルパー |
    | `plugin-sdk/security-runtime` | 共有の trust、DM gating、external-content、および secret-collection ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト allowlist と private-network SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広い infra ランタイムサーフェスを含まない狭い pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF ガード付き fetch、および SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | secret 入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/target ヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主要 export |
    | --- | --- |
    | `plugin-sdk/runtime` | 広いランタイム/ロギング/バックアップ/Plugin インストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイム env、logger、timeout、retry、および backoff ヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用 Channel ランタイムコンテキストの登録と検索ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有 Plugin command/hook/http/interactive ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/internal hook パイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` のような遅延ランタイム import/binding ヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI 整形、待機、およびバージョンヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアントと Channel ステータスパッチヘルパー |
    | `plugin-sdk/config-runtime` | 設定の読み込み/書き込みヘルパーと Plugin 設定検索ヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドル済み Telegram コントラクトサーフェスが利用できない場合でも使える、Telegram コマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広い text-runtime バレルを含まないファイル参照 autolink 検出 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ヘルパー、承認 capability ビルダー、auth/profile ヘルパー、ネイティブルーティング/ランタイムヘルパー |
    | `plugin-sdk/reply-runtime` | 共有の受信/reply ランタイムヘルパー、chunking、dispatch、Heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い reply dispatch/finalize ヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` のような共有 short-window reply-history ヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いテキスト/Markdown chunking ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアのパス + updated-at ヘルパー |
    | `plugin-sdk/state-paths` | state/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` のような route/session-key/account binding ヘルパー |
    | `plugin-sdk/status-helpers` | 共有 Channel/account ステータス要約ヘルパー、ランタイム状態デフォルト、および issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有 target resolver ヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/string 正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を返すタイムアウト付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通の tool/CLI パラメーターリーダー |
    | `plugin-sdk/tool-payload` | tool result オブジェクトから正規化 payload を抽出 |
    | `plugin-sdk/tool-send` | tool args から正規の send target フィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有の一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステム logger と秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードヘルパー |
    | `plugin-sdk/json-store` | 小規模 JSON state の読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能なファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックの dedupe キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションおよび reply-dispatch ヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動 import を伴わない読み取り専用 ACP binding 解決 |
    | `plugin-sdk/agent-config-primitives` | 狭い agent ランタイム config-schema primitive |
    | `plugin-sdk/boolean-param` | 緩い boolean パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | dangerous-name マッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップと pairing token ヘルパー |
    | `plugin-sdk/extension-shared` | 共有の passive-channel、ステータス、および ambient proxy helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/provider reply ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skills コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリの構築/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベル agent harness 向けの実験的な信頼済み Plugin サーフェス: harness 型、アクティブ実行の steer/abort ヘルパー、OpenClaw ツールブリッジヘルパー、および試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/Heartbeat ヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模な件数制限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | diagnostic フラグとイベントヘルパー |
    | `plugin-sdk/error-runtime` | error graph、整形、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済み fetch、proxy、および pinned lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch import を含まない dispatcher-aware なランタイム fetch |
    | `plugin-sdk/response-limit-runtime` | 広い media runtime サーフェスを含まない件数制限付き response-body リーダー |
    | `plugin-sdk/session-binding-runtime` | configured binding routing や pairing store を含まない現在の会話 binding 状態 |
    | `plugin-sdk/session-store-runtime` | 広い設定書き込み/保守 import を含まない session-store 読み取りヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広い設定/セキュリティ import を含まない context visibility 解決と補助コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/logging import を含まない狭い primitive record/string 強制変換および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名および SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | retry 設定と retry runner ヘルパー |
    | `plugin-sdk/agent-runtime` | agent ディレクトリ/identity/workspace ヘルパー |
    | `plugin-sdk/directory-runtime` | config バックのディレクトリ問い合わせ/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="capability とテストのサブパス">
    | サブパス | 主要 export |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディア fetch/transform/store ヘルパーと media payload ビルダー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成 failover ヘルパー、候補選択、および model 未設定時メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解 provider 型と provider 向け画像/音声ヘルパー export |
    | `plugin-sdk/text-runtime` | assistant 可視テキストの除去、Markdown render/chunking/table ヘルパー、秘匿化ヘルパー、directive-tag ヘルパー、および safe-text ユーティリティのような共有 text/Markdown/logging ヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキスト chunking ヘルパー |
    | `plugin-sdk/speech` | Speech provider 型と provider 向け directive、registry、および検証ヘルパー |
    | `plugin-sdk/speech-core` | 共有 Speech provider 型、registry、directive、および正規化ヘルパー |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こし provider 型、registry ヘルパー、および共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声 provider 型と registry ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成 provider 型 |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、failover、auth、および registry ヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成 provider/request/result 型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、failover ヘルパー、provider lookup、および model-ref 解析 |
    | `plugin-sdk/video-generation` | 動画生成 provider/request/result 型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、failover ヘルパー、provider lookup、および model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook target レジストリと route-install ヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有のリモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | Plugin SDK 利用者向けに再 export された `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主要 export |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI ヘルパー向けのバンドル済み memory-core helper サーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリ index/search ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリ host foundation engine export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリ host の embedding コントラクト、registry アクセス、ローカル provider、および汎用 batch/remote ヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリ host QMD engine export |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリ host storage engine export |
    | `plugin-sdk/memory-core-host-multimodal` | メモリ host マルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリ host クエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリ host secret ヘルパー |
    | `plugin-sdk/memory-core-host-events` | メモリ host イベントジャーナルヘルパー |
    | `plugin-sdk/memory-core-host-status` | メモリ host ステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリ host CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリ host コアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリ host ファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリ host コアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリ host イベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | メモリ host ファイル/ランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | search-manager アクセス用の Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリ host ステータスヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドル済み memory-lancedb helper サーフェス |
  </Accordion>

  <Accordion title="予約済みの bundled-helper サブパス">
    | ファミリー | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドル済み browser Plugin サポートヘルパー（`browser-support` は互換性バレルのまま） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドル済み Matrix helper/runtime サーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドル済み LINE helper/runtime サーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドル済み IRC helper サーフェス |
    | Channel 固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドル済み Channel 互換性/ヘルパーの継ぎ目 |
    | 認証/Plugin 固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドル済み機能/Plugin ヘルパーの継ぎ目。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を export します |
  </Accordion>
</AccordionGroup>

## 登録 API

`register(api)` コールバックは、以下のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### capability の登録

| メソッド                                           | 登録するもの                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                  |
| `api.registerAgentHarness(...)`                  | 実験的な低レベル agent 実行器 |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド           |
| `api.registerChannel(...)`                       | メッセージング Channel                     |
| `api.registerSpeechProvider(...)`                | 音声合成 / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミング realtime transcription      |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向 realtime 音声セッション        |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析            |
| `api.registerImageGenerationProvider(...)`       | 画像生成                      |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                      |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                      |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider           |
| `api.registerWebSearchProvider(...)`             | Web 検索                            |

### ツールとコマンド

| メソッド                          | 登録するもの                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須、または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）             |

### インフラストラクチャ

| メソッド                                          | 登録するもの                       |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | イベント hook                              |
| `api.registerHttpRoute(params)`                 | Gateway HTTP エンドポイント                   |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC メソッド                      |
| `api.registerCli(registrar, opts?)`             | CLI サブコマンド                          |
| `api.registerService(service)`                  | バックグラウンドサービス                      |
| `api.registerInteractiveHandler(registration)`  | interactive handler                     |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi 組み込みランナー extension factory    |
| `api.registerMemoryPromptSupplement(builder)`   | 加算的なメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`   | 加算的なメモリ検索/読み取りコーパス      |

予約済みコア管理名前空間（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、
常に `operator.admin` のままです。
Plugin が所有するメソッドには、Plugin 固有のプレフィックスを優先してください。

`api.registerEmbeddedExtensionFactory(...)` は、Plugin が OpenClaw 組み込み実行中に
Pi ネイティブのイベントタイミングを必要とする場合に使用します。たとえば、最終的な tool-result メッセージが発行される前に行う必要がある非同期の `tool_result`
書き換えなどです。これは現在、バンドル済み Plugin 向けの継ぎ目です。登録できるのはバンドル済み Plugin のみで、
`openclaw.plugin.json` で `contracts.embeddedExtensionFactories: ["pi"]` を宣言している必要があります。この低レベルの継ぎ目を必要としないものには、通常の OpenClaw Plugin hook を使ってください。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け付けます。

- `commands`: registrar が所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、
  ルーティング、および遅延 Plugin CLI 登録に使われる parse-time コマンドディスクリプター

Plugin コマンドを通常のルート CLI パスで遅延読み込みのままにしたい場合は、
その registrar が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定してください。

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
        description: "Matrix アカウント、検証、デバイス、およびプロファイル状態を管理する",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` 単独は、遅延ルート CLI 登録が不要な場合にのみ使ってください。
この eager 互換パスは引き続きサポートされていますが、parse-time の遅延読み込み用の descriptor バック placeholder はインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` により、Plugin は `codex-cli` のようなローカル
AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンド `id` は、`codex-cli/gpt-5` のようなモデル参照における provider プレフィックスになります。
- バックエンド `config` は `agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI 実行前に、Plugin デフォルトの上に `agents.defaults.cliBackends.<id>` をマージします。
- マージ後にバックエンドが互換性書き換えを必要とする場合（たとえば古いフラグ形状の正規化など）は、`normalizeConfig` を使ってください。

### 排他的スロット

| メソッド                                     | 登録するもの                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統一メモリ capability                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                    |

### メモリ embedding アダプター

| メソッド                                         | 登録するもの                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブ Plugin 用のメモリ embedding アダプター |

- `registerMemoryCapability` が推奨される排他的メモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、
  companion Plugin は特定のメモリ Plugin の private layout に踏み込むのではなく、
  `openclaw/plugin-sdk/memory-host-core` を通じて export されたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリ Plugin API です。
- `registerMemoryEmbeddingProvider` により、アクティブなメモリ Plugin は 1 つ以上の embedding アダプター id
  （たとえば `openai`、`gemini`、または Plugin 定義のカスタム id）を登録できます。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` のようなユーザー設定は、
  それらの登録済みアダプター id に対して解決されます。

### イベントとライフサイクル

| メソッド                                       | 機能                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクル hook          |
| `api.onConversationBindingResolved(handler)` | 会話 binding コールバック |

### Hook の決定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかの handler がこれを設定すると、それより低い優先度の handler はスキップされます。
- `before_tool_call`: `{ block: false }` を返しても決定とはみなされません（`block` を省略した場合と同じ）であり、上書きではありません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかの handler がこれを設定すると、それより低い優先度の handler はスキップされます。
- `before_install`: `{ block: false }` を返しても決定とはみなされません（`block` を省略した場合と同じ）であり、上書きではありません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかの handler が dispatch を引き受けると、それより低い優先度の handler とデフォルトのモデル dispatch パスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかの handler がこれを設定すると、それより低い優先度の handler はスキップされます。
- `message_sending`: `{ cancel: false }` を返しても決定とはみなされません（`cancel` を省略した場合と同じ）であり、上書きではありません。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの `threadId` フィールドを使ってください。`metadata` は Channel 固有の追加情報用に保持してください。
- `message_sending`: Channel 固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使ってください。
- `gateway_start`: 内部の `gateway:startup` hook に依存するのではなく、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使ってください。

### API オブジェクトのフィールド

| フィールド                    | 型                      | 説明                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                   |
| `api.description`        | `string?`                 | Plugin 説明（任意）                                                               |
| `api.source`             | `string`                  | Plugin ソースパス                                                                          |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                            |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                   |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | スコープ付き logger（`debug`, `info`, `warn`, `error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は、完全なエントリ前の軽量な起動/セットアップウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                        |

## 内部モジュール規約

Plugin 内では、内部 import にローカルバレルファイルを使ってください。

```
my-plugin/
  api.ts            # 外部利用者向けの公開 export
  runtime-api.ts    # 内部専用ランタイム export
  index.ts          # Plugin エントリポイント
  setup-entry.ts    # 軽量なセットアップ専用エントリ（任意）
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` を通じて
  自分自身の Plugin を import しないでください。内部 import は `./api.ts` または
  `./runtime-api.ts` を通してください。SDK パスは外部コントラクト専用です。
</Warning>

ファサード読み込みされるバンドル済み Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、OpenClaw がすでに実行中であれば、現在のランタイム設定スナップショットを優先するようになっています。まだランタイムスナップショットが存在しない場合は、ディスク上で解決された設定ファイルにフォールバックします。

Provider Plugin は、ヘルパーが意図的に provider 固有で、まだ汎用 SDK
サブパスに属さない場合、狭い Plugin ローカルのコントラクトバレルを公開することもできます。現在のバンドル済みの例: Anthropic provider は、Anthropic beta-header や `service_tier` ロジックを汎用
`plugin-sdk/*` コントラクトに昇格させる代わりに、自身の公開 `api.ts` / `contract-api.ts` の継ぎ目に Claude ストリームヘルパーを保持しています。

その他の現在のバンドル済み例:

- `@openclaw/openai-provider`: `api.ts` は provider builder、
  default-model ヘルパー、および realtime provider builder を export します
- `@openclaw/openrouter-provider`: `api.ts` は provider builder に加えて
  オンボーディング/設定ヘルパーを export します

<Warning>
  拡張の本番コードでも、`openclaw/plugin-sdk/<other-plugin>` の
  import は避けるべきです。ヘルパーが本当に共有されるべきものなら、2 つの Plugin を結合してしまうのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または他の
  capability 指向サーフェスのような中立的な SDK サブパスに昇格させてください。
</Warning>

## 関連

- [Entry Points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry` のオプション
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — 完全な `api.runtime` 名前空間リファレンス
- [Setup and Config](/ja-JP/plugins/sdk-setup) — パッケージ化、manifest、設定スキーマ
- [Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと lint ルール
- [SDK Migration](/ja-JP/plugins/sdk-migration) — 非推奨サーフェスからの移行
- [Plugin Internals](/ja-JP/plugins/architecture) — 詳細なアーキテクチャと capability モデル
