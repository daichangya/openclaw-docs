---
read_when:
    - どのSDKサブパスからインポートするかを知る必要がある場合
    - OpenClawPluginApiのすべての登録メソッドのリファレンスが必要な場合
    - 特定のSDKエクスポートを調べている場合
sidebarTitle: SDK Overview
summary: インポートマップ、登録APIリファレンス、およびSDKアーキテクチャ
title: Plugin SDKの概要
x-i18n:
    generated_at: "2026-04-06T04:45:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: acd2887ef52c66b2f234858d812bb04197ecd0bfb3e4f7bf3622f8fdc765acad
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDKの概要

plugin SDKは、プラグインとコアの間の型付きコントラクトです。このページは、
**何をインポートするか** と **何を登録できるか** のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初のプラグインですか？ [はじめに](/ja-JP/plugins/building-plugins) から始めてください
  - チャンネルプラグインですか？ [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください
  - プロバイダープラグインですか？ [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください
</Tip>

## インポート規約

必ず特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動を高速に保ち、
循環依存の問題を防ぎます。チャンネル固有のエントリ/ビルドヘルパーには、
`openclaw/plugin-sdk/channel-core` を優先し、より広いアンブレラサーフェスや
`buildChannelConfigSchema` のような共有ヘルパーには `openclaw/plugin-sdk/core` を使ってください。

`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp` のような
プロバイダー名付きの便利な境界や、チャンネルブランド付きのヘルパー境界を追加したり、
依存したりしないでください。バンドルされたプラグインは、自身の `api.ts` または
`runtime-api.ts` バレル内で汎用的なSDKサブパスを組み合わせるべきであり、コアは
それらのプラグインローカルなバレルを使うか、本当にチャンネル横断の必要がある場合にのみ
狭い汎用SDKコントラクトを追加するべきです。

生成されたエクスポートマップには、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、
`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような、
バンドルプラグイン用の小規模なヘルパー境界が引き続き含まれています。これらの
サブパスは、バンドルプラグインの保守と互換性のためだけに存在します。意図的に
以下の一般的なテーブルからは除外されており、新しいサードパーティプラグインに
推奨されるインポートパスではありません。

## サブパスリファレンス

目的別にまとめた、最もよく使われるサブパスです。生成される完全な200以上の
サブパス一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約済みのバンドルプラグイン用ヘルパーサブパスも、その生成リストには引き続き表示されます。
ドキュメントページで明示的に公開サーフェスとして案内されていない限り、
それらは実装詳細/互換性サーフェスとして扱ってください。

### プラグインエントリ

| サブパス                    | 主なエクスポート                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="チャンネルサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zodスキーマエクスポート (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、allowlist プロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭い用途のアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | チャンネル設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドルコントラクトのフォールバック付きTelegramカスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共有の受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有の受信記録およびディスパッチヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲットの解析/照合ヘルパー |
    | `plugin-sdk/outbound-media` | 共有の送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信元アイデンティティ/送信デリゲートヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーのエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、および設定済みバインディングのヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムのグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有のチャンネルステータススナップショット/サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭い用途のチャンネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みの認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有のチャンネルプラグイン前提エクスポート |
    | `plugin-sdk/allowlist-config-edit` | allowlist 設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有のグループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有のダイレクトDM認証/ガードヘルパー |
    | `plugin-sdk/interactive-runtime` | 対話型返信ペイロードの正規化/削減ヘルパー |
    | `plugin-sdk/channel-inbound` | デバウンス、メンション照合、エンベロープヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | ターゲットの解析/照合ヘルパー |
    | `plugin-sdk/channel-contract` | チャンネルコントラクト型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション接続 |
  </Accordion>

  <Accordion title="プロバイダーサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーのセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換のセルフホスト型プロバイダーに特化したセットアップヘルパー |
    | `plugin-sdk/provider-auth-runtime` | プロバイダープラグイン向けのランタイムAPIキー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | APIキーのオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準OAuth auth-result ビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダープラグイン向け共有対話型ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証用環境変数の検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有 replay-policy ビルダー、provider-endpoint ヘルパー、および `normalizeNativeXaiModelId` のような model-id 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダーHTTP/endpoint capability ヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch プロバイダーの登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search` | web-search プロバイダーの登録/キャッシュ/設定ヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI 互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共有の Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルな singleton/map/cache ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, コマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決および同一チャット action-auth ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ実行承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認 capability/delivery アダプター |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + account-binding ヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証 + ネイティブ session-target ヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-surface` | コマンド本文の正規化と command-surface ヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | 共有の信頼、DMゲーティング、外部コンテンツ、およびシークレット収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト allowlist およびプライベートネットワークSSRFポリシーヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF保護付き fetch、および SSRFポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | webhook リクエスト/ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエストボディサイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/プラグインインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭い用途のランタイム env、logger、timeout、retry、および backoff ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有のプラグイン command/hook/http/interactive ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有の webhook/internal hook パイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` のような遅延ランタイム import/binding ヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI整形、待機、およびバージョンヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアントおよびチャンネルステータスパッチヘルパー |
    | `plugin-sdk/config-runtime` | 設定の読み込み/書き込みヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされたTelegramコントラクトサーフェスが利用できない場合でも、Telegramコマンド名/説明の正規化と重複/競合チェックを行う |
    | `plugin-sdk/approval-runtime` | exec/plugin 承認ヘルパー、approval-capability ビルダー、auth/profile ヘルパー、ネイティブルーティング/ランタイムヘルパー |
    | `plugin-sdk/reply-runtime` | 共有の受信/返信ランタイムヘルパー、チャンク化、ディスパッチ、heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い用途の返信ディスパッチ/完了ヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` のような共有の短時間ウィンドウ reply-history ヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭い用途のテキスト/markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアのパス + updated-at ヘルパー |
    | `plugin-sdk/state-paths` | State/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` のようなルート/session-key/account binding ヘルパー |
    | `plugin-sdk/status-helpers` | 共有のチャンネル/アカウントステータスサマリーヘルパー、runtime-state デフォルト、および issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | Slug/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を伴う時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通の tool/CLI パラメーターリーダー |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信ターゲットフィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有の一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステム logger とリダクションヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdownテーブルモードヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON state の読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能 file-lock ヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックアップ付き dedupe cache ヘルパー |
    | `plugin-sdk/acp-runtime` | ACP runtime/session および reply-dispatch ヘルパー |
    | `plugin-sdk/agent-config-primitives` | 狭い用途のエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩い boolean パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前の照合解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスbootstrap およびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有の passive-channel および status ヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skills コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリの build/serialize ヘルパー |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/heartbeat ヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模の有界 cache ヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグおよびイベントヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、整形、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、proxy、および pinned lookup ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名およびSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | retry 設定および retry ランナーヘルパー |
    | `plugin-sdk/agent-runtime` | エージェントディレクトリ/アイデンティティ/workspace ヘルパー |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリ照会/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有のメディア取得/変換/保存ヘルパーに加え、メディアペイロードビルダー |
    | `plugin-sdk/media-generation-runtime` | 共有のメディア生成フェイルオーバーヘルパー、候補選択、およびモデル未指定メッセージング |
    | `plugin-sdk/media-understanding` | Media understanding プロバイダー型に加え、プロバイダー向け画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | assistant-visible-text の除去、markdown のレンダリング/チャンク化/テーブルヘルパー、リダクションヘルパー、directive-tag ヘルパー、安全なテキストユーティリティなどの共有テキスト/markdown/ロギングヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型に加え、プロバイダー向け directive、registry、および検証ヘルパー |
    | `plugin-sdk/speech-core` | 共有の音声プロバイダー型、registry、directive、および正規化ヘルパー |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型およびレジストリヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型およびレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型 |
    | `plugin-sdk/image-generation-core` | 共有の画像生成型、フェイルオーバー、認証、およびレジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有の音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、および model-ref 解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有の動画生成型、フェイルオーバーヘルパー、プロバイダー検索、および model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhookターゲットレジストリおよび route-install ヘルパー |
    | `plugin-sdk/webhook-path` | Webhookパス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有のリモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | プラグインSDK利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="メモリサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI ヘルパー用のバンドルされた memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト foundation engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト embedding engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホスト storage engine エクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホスト multimodal ヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホスト query ヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホスト secret ヘルパー |
    | `plugin-sdk/memory-core-host-events` | メモリホスト event journal ヘルパー |
    | `plugin-sdk/memory-core-host-status` | メモリホスト status ヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホスト core ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホスト file/runtime ヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホスト core ランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホスト event journal ヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | メモリホスト file/runtime ヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ周辺プラグイン向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | search-manager アクセス用のアクティブメモリランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリホスト status ヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドルされた memory-lancedb ヘルパーサーフェス |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    | ファミリー | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドルされたブラウザプラグイン支援ヘルパー (`browser-support` は互換性バレルのまま) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドルされたMatrixヘルパー/ランタイムサーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドルされたLINEヘルパー/ランタイムサーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドルされたIRCヘルパーサーフェス |
    | チャンネル固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドルされたチャンネル互換性/ヘルパー境界 |
    | 認証/プラグイン固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドルされた機能/プラグインヘルパー境界; `plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をエクスポート |
  </Accordion>
</AccordionGroup>

## 登録API

`register(api)` コールバックは、以下のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### 機能の登録

| メソッド                                           | 登録するもの                   |
| ------------------------------------------------ | ----------------------------- |
| `api.registerProvider(...)`                      | テキスト推論 (LLM)            |
| `api.registerChannel(...)`                       | メッセージングチャンネル      |
| `api.registerSpeechProvider(...)`                | 音声合成 / STT synthesis      |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングのリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画の解析          |
| `api.registerImageGenerationProvider(...)`       | 画像生成                      |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                      |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                      |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape プロバイダー |
| `api.registerWebSearchProvider(...)`             | Web検索                       |

### ツールとコマンド

| メソッド                          | 登録するもの                                |
| ------------------------------- | ------------------------------------------ |
| `api.registerTool(tool, opts?)` | エージェントツール（必須、または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLMをバイパス）            |

### インフラストラクチャ

| メソッド                                         | 登録するもの                              |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                            |
| `api.registerHttpRoute(params)`                | Gateway HTTPエンドポイント                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPCメソッド                       |
| `api.registerCli(registrar, opts?)`            | CLIサブコマンド                           |
| `api.registerService(service)`                 | バックグラウンドサービス                  |
| `api.registerInteractiveHandler(registration)` | 対話型ハンドラー                          |
| `api.registerMemoryPromptSupplement(builder)`  | 加算的なメモリ隣接プロンプトセクション    |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加算的なメモリ検索/読み取りコーパス       |

予約済みのコア管理名前空間（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は、プラグインがより狭いGatewayメソッドスコープを割り当てようとしても、
常に `operator.admin` のままです。プラグイン所有メソッドには、
プラグイン固有のプレフィックスを使ってください。

### CLI登録メタデータ

`api.registerCli(registrar, opts?)` は、2種類のトップレベルメタデータを受け付けます。

- `commands`: registrar が所有する明示的なコマンドルート
- `descriptors`: ルートCLIヘルプ、ルーティング、および遅延プラグインCLI登録に使われる
  解析時コマンドディスクリプター

プラグインコマンドを通常のルートCLIパスで遅延ロードのままにしたい場合は、
その registrar が公開するすべてのトップレベルコマンドルートをカバーする
`descriptors` を指定してください。

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
        description: "Matrixアカウント、検証、デバイス、およびプロファイル状態を管理します",
        hasSubcommands: true,
      },
    ],
  },
);
```

遅延ルートCLI登録が不要な場合にのみ、`commands` を単独で使用してください。
その即時互換パスは引き続きサポートされていますが、解析時の遅延ロード用に
descriptor に裏付けられたプレースホルダーはインストールされません。

### 排他的スロット

| メソッド                                     | 登録するもの                        |
| ------------------------------------------ | ---------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に1つのみアクティブ） |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー   |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー     |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター           |

### メモリ埋め込みアダプター

| メソッド                                         | 登録するもの                                 |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブなプラグイン用のメモリ埋め込みアダプター |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, および
  `registerMemoryRuntime` は、メモリプラグイン専用です。
- `registerMemoryEmbeddingProvider` により、アクティブなメモリプラグインは
  1つ以上の埋め込みアダプターID（たとえば `openai`、`gemini`、または
  プラグイン定義のカスタムID）を登録できます。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` のようなユーザー設定は、
  それらの登録済みアダプターIDに対して解決されます。

### イベントとライフサイクル

| メソッド                                       | 動作内容                    |
| -------------------------------------------- | ------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

### フック判定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返しても判定なしとして扱われます（`block` を省略した場合と同じ）であり、上書きではありません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返しても判定なしとして扱われます（`block` を省略した場合と同じ）であり、上書きではありません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを引き受けると、より低優先度のハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返しても判定なしとして扱われます（`cancel` を省略した場合と同じ）であり、上書きではありません。

### APIオブジェクトのフィールド

| フィールド                | 型                        | 説明                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | プラグインID                                                                                |
| `api.name`               | `string`                  | 表示名                                                                                      |
| `api.version`            | `string?`                 | プラグインバージョン（任意）                                                                |
| `api.description`        | `string?`                 | プラグインの説明（任意）                                                                    |
| `api.source`             | `string`                  | プラグインのソースパス                                                                      |
| `api.rootDir`            | `string?`                 | プラグインのルートディレクトリ（任意）                                                      |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` から取得したプラグイン固有設定                               |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | スコープ付き logger (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は、軽量なフルエントリ前の起動/セットアップウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | プラグインルートからの相対パスを解決                                                        |

## 内部モジュール規約

プラグイン内では、内部インポートにローカルのバレルファイルを使用してください。

```
my-plugin/
  api.ts            # 外部利用者向けの公開エクスポート
  runtime-api.ts    # 内部専用ランタイムエクスポート
  index.ts          # プラグインエントリポイント
  setup-entry.ts    # 軽量のセットアップ専用エントリ（任意）
```

<Warning>
  本番コード内で、自分自身のプラグインを `openclaw/plugin-sdk/<your-plugin>`
  経由でインポートしてはいけません。内部インポートは `./api.ts` または
  `./runtime-api.ts` を経由してください。SDKパスは外部コントラクト専用です。
</Warning>

ファサード読み込みされたバンドルプラグインの公開サーフェス（`api.ts`、
`runtime-api.ts`、`index.ts`、`setup-entry.ts`、および類似の公開エントリファイル）は、
OpenClaw がすでに実行中であれば、アクティブなランタイム設定スナップショットを
優先するようになりました。まだランタイムスナップショットが存在しない場合は、
ディスク上で解決された設定ファイルにフォールバックします。

プロバイダープラグインは、ヘルパーが意図的にプロバイダー固有であり、まだ汎用SDK
サブパスに属さない場合、狭い用途のプラグインローカルなコントラクトバレルを
公開することもできます。現在のバンドル例: Anthropicプロバイダーは、
Anthropic beta-header と `service_tier` ロジックを汎用の `plugin-sdk/*`
コントラクトに昇格させる代わりに、自身の公開 `api.ts` / `contract-api.ts`
境界に Claude ストリームヘルパーを保持しています。

その他の現在のバンドル例:

- `@openclaw/openai-provider`: `api.ts` はプロバイダービルダー、
  default-model ヘルパー、およびリアルタイムプロバイダービルダーをエクスポート
- `@openclaw/openrouter-provider`: `api.ts` はプロバイダービルダーに加え、
  オンボーディング/設定ヘルパーをエクスポート

<Warning>
  拡張機能の本番コードも、`openclaw/plugin-sdk/<other-plugin>` のインポートを避けるべきです。
  ヘルパーが本当に共有されるべきものなら、2つのプラグインを結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または他の
  capability 指向サーフェスのような中立的なSDKサブパスへ昇格させてください。
</Warning>

## 関連

- [Entry Points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry` のオプション
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — `api.runtime` 名前空間の完全なリファレンス
- [Setup and Config](/ja-JP/plugins/sdk-setup) — パッケージ化、マニフェスト、設定スキーマ
- [Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティとlintルール
- [SDK Migration](/ja-JP/plugins/sdk-migration) — 非推奨サーフェスからの移行
- [Plugin Internals](/ja-JP/plugins/architecture) — 詳細なアーキテクチャと機能モデル
