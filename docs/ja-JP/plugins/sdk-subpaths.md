---
read_when:
    - プラグインの import に適した plugin-sdk サブパスの選び方
    - バンドルされたプラグインのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どの import がどこにあるか、領域ごとにグループ化'
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-04-25T13:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  plugin SDK は `openclaw/plugin-sdk/` 配下の狭く分けられたサブパス群として公開されています。
  このページでは、よく使われるサブパスを用途ごとにまとめています。生成された
  200 以上のサブパスの完全な一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
  予約済みの bundled-plugin ヘルパー用サブパスもそこに含まれますが、ドキュメントのページで
  明示的に案内されていない限り、これらは実装詳細です。

  プラグイン作成ガイドについては、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

  ## プラグインエントリ

  | サブパス                    | 主なエクスポート                                                                                                                       |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマのエクスポート (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、allowlist プロンプト、セットアップ状態ビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭く絞ったアカウント一覧/アカウント操作ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | bundled-contract フォールバックを備えた Telegram カスタムコマンドの正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 狭く絞ったコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、ドラフトストリームのライフサイクル/完了化ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有の受信ルート + envelope ビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有の受信記録およびディスパッチヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/照合ヘルパー |
    | `plugin-sdk/outbound-media` | 共有の送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信配信、アイデンティティ、send delegate、セッション、フォーマット、および payload 計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 狭く絞った poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシー agent media payload ビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、および設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイム group-policy 解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有の Channel 状態スナップショット/サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭く絞った Channel 設定スキーマ primitive |
    | `plugin-sdk/channel-config-writes` | Channel 設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有 Channel plugin prelude エクスポート |
    | `plugin-sdk/allowlist-config-edit` | allowlist 設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有 group-access 判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有 direct-DM 認証/ガードヘルパー |
    | `plugin-sdk/interactive-runtime` | セマンティックなメッセージ提示、配信、およびレガシー interactive reply ヘルパー。[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | 受信 debounce、mention 照合、mention-policy ヘルパー、および envelope ヘルパーの互換性バレル |
    | `plugin-sdk/channel-inbound-debounce` | 狭く絞った受信 debounce ヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広い受信ランタイムサーフェスを含まない、狭く絞った mention-policy および mention テキストヘルパー |
    | `plugin-sdk/channel-envelope` | 狭く絞った受信 envelope フォーマットヘルパー |
    | `plugin-sdk/channel-location` | Channel location コンテキストおよびフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップおよび typing/ack 失敗向けの Channel ロギングヘルパー |
    | `plugin-sdk/channel-send-result` | reply result 型 |
    | `plugin-sdk/channel-actions` | Channel message-action ヘルパー、およびプラグイン互換性のために維持されている非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析/照合ヘルパー |
    | `plugin-sdk/channel-contract` | Channel contract 型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、および secret target 型のような、狭く絞った secret-contract ヘルパー |
  </Accordion>

  <Accordion title="Provider subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選された local/self-hosted provider セットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換の self-hosted provider 向けに絞ったセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | provider プラグイン向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` のような API キーのオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth auth-result ビルダー |
    | `plugin-sdk/provider-auth-login` | provider プラグイン向けの共有 interactive login ヘルパー |
    | `plugin-sdk/provider-env-vars` | provider 認証 env var 検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有 replay-policy ビルダー、provider endpoint ヘルパー、および `normalizeNativeXaiModelId` のような model-id 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用 provider HTTP/endpoint capability ヘルパー、provider HTTP エラー、および音声文字起こし multipart form ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` のような、狭く絞った web-fetch 設定/選択 contract ヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | プラグイン有効化の配線を必要としない provider 向けの、狭く絞った web-search 設定/資格情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびスコープ付き資格情報 setter/getter のような、狭く絞った web-search 設定/資格情報 contract ヘルパー |
    | `plugin-sdk/provider-web-search` | web-search provider 登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマのクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI compat ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper 型、および共有の Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper ヘルパー |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message 変換、書き込み可能な transport event stream などのネイティブ provider transport ヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルの singleton/map/cache ヘルパー |
    | `plugin-sdk/group-activation` | 狭く絞ったグループ有効化モードおよびコマンド解析ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、動的引数メニューのフォーマットを含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決および同一チャットの action-auth ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認のプロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認の capability/delivery アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有の承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットなチャネルエントリポイント向けの軽量なネイティブ承認アダプターロードヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い承認ハンドラーランタイムヘルパー。より狭い adapter/gateway シームで足りる場合はそちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin 承認 reply payload ヘルパー |
    | `plugin-sdk/approval-runtime` | exec/plugin 承認 payload ヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、および `formatApprovalDisplayPath` のような構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 狭く絞った受信 reply 重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広い testing バレルを含まない、狭く絞った Channel contract テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブ command auth、動的引数メニューのフォーマット、およびネイティブ session-target ヘルパー |
    | `plugin-sdk/command-detection` | 共有 command 検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットなチャネルパス向けの軽量なコマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化および command-surface ヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret サーフェス向けの、狭く絞った secret-contract 収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config 解析向けの、狭く絞った `coerceSecretRef` および SecretRef 型付けヘルパー |
    | `plugin-sdk/security-runtime` | 共有の trust、DM ゲーティング、external-content、および secret-collection ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト allowlist およびプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広い infra ランタイムサーフェスを含まない、狭く絞った pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF ガード付き fetch、および SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | secret 入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 幅広いランタイム/ロギング/バックアップ/プラグインインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭く絞ったランタイム env、ロガー、タイムアウト、リトライ、およびバックオフヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用 Channel ランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有のプラグイン command/hook/http/interactive ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有の Webhook/internal hook パイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` などの遅延ランタイム import/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス exec ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI フォーマット、待機、バージョン、引数呼び出し、および遅延 command-group ヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアントおよび Channel 状態パッチヘルパー |
    | `plugin-sdk/config-runtime` | 設定の読み込み/書き込みヘルパーおよび plugin-config 検索ヘルパー |
    | `plugin-sdk/telegram-command-config` | bundled Telegram contract サーフェスが利用できない場合でも使える、Telegram コマンド名/説明の正規化および重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広い text-runtime バレルを含まないファイル参照 autolink 検出 |
    | `plugin-sdk/approval-runtime` | exec/plugin 承認ヘルパー、承認 capability ビルダー、auth/profile ヘルパー、ネイティブルーティング/ランタイムヘルパー、および構造化された承認表示パスのフォーマット |
    | `plugin-sdk/reply-runtime` | 共有の受信/reply ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭く絞った reply ディスパッチ/完了化および conversation-label ヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの共有短時間 reply-history ヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭く絞った text/markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアのパス + updated-at ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有の Channel/アカウント状態サマリーヘルパー、ランタイム状態のデフォルト、および issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風の入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化済み stdout/stderr 結果を返す時間計測付きコマンドランナー |
    | `plugin-sdk/param-readers` | 一般的なツール/CLI パラメータリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化済み payload を抽出 |
    | `plugin-sdk/tool-send` | ツール引数から標準的な送信ターゲットフィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有の一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムロガーおよび秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードおよび変換ヘルパー |
    | `plugin-sdk/json-store` | 小規模 JSON 状態の読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックの重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションおよび reply-dispatch ヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動 import を伴わない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭く絞った agent ランタイム config-schema primitive |
    | `plugin-sdk/boolean-param` | 緩やかな真偽値パラメータリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前の照合解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイス bootstrap およびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有の passive-channel、status、および ambient proxy ヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/provider reply ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skills コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリの構築/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベル agent harness 向けの実験的 trusted-plugin サーフェス: harness 型、active-run の steer/abort ヘルパー、OpenClaw ツールブリッジヘルパー、ツール進行状況のフォーマット/詳細ヘルパー、および attempt result ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint 検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/Heartbeat ヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模な上限制付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグおよびイベントヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、proxy、および pinned lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch import を含まない dispatcher 対応ランタイム fetch |
    | `plugin-sdk/response-limit-runtime` | 広い media ランタイムサーフェスを含まない上限制付き response-body リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングのルーティングやペアリングストアを含まない現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広い設定書き込み/保守 import を含まないセッションストア読み取りヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広い config/security import を含まないコンテキスト可視性解決および補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging import を含まない、狭く絞った primitive record/文字列 coercion および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名および SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定およびリトライ実行ヘルパー |
    | `plugin-sdk/agent-runtime` | agent ディレクトリ/アイデンティティ/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定ベースのディレクトリ問い合わせ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディア fetch/変換/保存ヘルパーに加え、media payload ビルダー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` のような、狭く絞ったメディア保存ヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有 media-generation フェイルオーバーヘルパー、候補選択、およびモデル未設定メッセージ |
    | `plugin-sdk/media-understanding` | media understanding provider 型に加え、provider 向け image/audio ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | assistant-visible-text の除去、markdown のレンダリング/チャンク化/テーブルヘルパー、秘匿化ヘルパー、directive-tag ヘルパー、および安全なテキストユーティリティなどの共有 text/markdown/logging ヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | speech provider 型に加え、provider 向け directive、registry、検証、および speech ヘルパーエクスポート |
    | `plugin-sdk/speech-core` | 共有 speech provider 型、registry、directive、正規化、および speech ヘルパーエクスポート |
    | `plugin-sdk/realtime-transcription` | realtime transcription provider 型、registry ヘルパー、および共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | realtime voice provider 型および registry ヘルパー |
    | `plugin-sdk/image-generation` | image generation provider 型 |
    | `plugin-sdk/image-generation-core` | 共有 image-generation 型、フェイルオーバー、auth、および registry ヘルパー |
    | `plugin-sdk/music-generation` | music generation provider/request/result 型 |
    | `plugin-sdk/music-generation-core` | 共有 music-generation 型、フェイルオーバーヘルパー、provider 検索、および model-ref 解析 |
    | `plugin-sdk/video-generation` | video generation provider/request/result 型 |
    | `plugin-sdk/video-generation-core` | 共有 video-generation 型、フェイルオーバーヘルパー、provider 検索、および model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリおよびルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有のリモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | plugin SDK 利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory のサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー向けの bundled memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | Memory インデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host 埋め込み contract、registry アクセス、local provider、および汎用バッチ/リモートヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine エクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine エクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host マルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | Memory host クエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret ヘルパー |
    | `plugin-sdk/memory-core-host-events` | Memory host イベントジャーナルヘルパー |
    | `plugin-sdk/memory-core-host-status` | Memory host ステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host コアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host ファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | Memory host コアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | Memory host イベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | Memory host ファイル/ランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | memory 隣接プラグイン向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス向けの Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | Memory host ステータスヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-lancedb` | bundled memory-lancedb ヘルパーサーフェス |
  </Accordion>

  <Accordion title="予約済み bundled-helper サブパス">
    | ファミリー | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | bundled browser plugin サポートヘルパー。`browser-profiles` は、正規化された `browser.tabCleanup` 形状向けに `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, `ResolvedBrowserTabCleanupConfig` をエクスポートします。`browser-support` は互換性バレルのままです。 |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | bundled Matrix ヘルパー/ランタイムサーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | bundled LINE ヘルパー/ランタイムサーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | bundled IRC ヘルパーサーフェス |
    | Channel 固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | bundled Channel 互換性/ヘルパーシーム |
    | Auth/プラグイン固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | bundled 機能/プラグインヘルパーシーム。`plugin-sdk/github-copilot-token` は現在、`DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をエクスポートします |
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
