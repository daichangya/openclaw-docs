---
read_when:
    - Plugin importに適したplugin-sdkサブパスの選択
    - バンドル済みPluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDKサブパスカタログ: どのimportがどこにあるか、領域ごとにグループ化'
title: Plugin SDKサブパス
x-i18n:
    generated_at: "2026-04-24T09:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDKは、`openclaw/plugin-sdk/` 配下の狭く分割されたサブパス群として公開されています。
  このページでは、よく使われるサブパスを用途別に整理して一覧化しています。生成される200以上のサブパスの完全な一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。予約済みのバンドル済みPluginヘルパーサブパスもそこに現れますが、ドキュメントページで明示的に案内されない限り、それらは実装詳細です。

  Plugin作成ガイドについては、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

  ## Pluginエントリ

  | Subpath                     | 主なexports                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="チャンネルサブパス">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zodスキーマexport（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、allowlistプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 複数アカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウントID正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭いアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | チャンネル設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きTelegramカスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 狭いコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、ドラフトストリームのライフサイクル/完了化ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有受信record-and-dispatchヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/一致ヘルパー |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信元アイデンティティ、送信デリゲート、ペイロード計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 狭いpoll正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | 従来のエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、およびconfigured-bindingヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャンネルステータススナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭いチャンネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャンネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャンネルPluginプレリュードexports |
    | `plugin-sdk/allowlist-config-edit` | allowlist設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有ダイレクトDM認証/ガードヘルパー |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージ表示、配信、および従来のインタラクティブ返信ヘルパー。[Message Presentation](/ja-JP/plugins/message-presentation) を参照 |
    | `plugin-sdk/channel-inbound` | 受信debounce、メンション一致、メンションポリシーヘルパー、およびエンベロープヘルパーの互換barrel |
    | `plugin-sdk/channel-inbound-debounce` | 狭い受信debounceヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広い受信ランタイムサーフェスを含まない、狭いメンションポリシーおよびメンションテキストヘルパー |
    | `plugin-sdk/channel-envelope` | 狭い受信エンベロープ整形ヘルパー |
    | `plugin-sdk/channel-location` | チャンネル位置情報コンテキストおよび整形ヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップおよびtyping/ack失敗向けのチャンネルログヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャンネルメッセージアクションヘルパー、およびPlugin互換性維持のため残されている非推奨ネイティブスキーマヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析/一致ヘルパー |
    | `plugin-sdk/channel-contract` | チャンネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` などの狭いsecret契約ヘルパー、およびsecret target型 |
  </Accordion>

  <Accordion title="プロバイダーサブパス">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換のセルフホスト型プロバイダーに特化したセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLIバックエンドデフォルト + watchdog定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダーPlugin向けランタイムAPIキー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などのAPIキーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準OAuth認証結果ビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダーPlugin向け共有対話型ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay-policyビルダー、プロバイダーendpointヘルパー、および `normalizeNativeXaiModelId` などのモデルID正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 音声文字起こしmultipart formヘルパーを含む、汎用プロバイダーHTTP/endpoint機能ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの狭いweb-fetch設定/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web-fetchプロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin有効化配線を必要としないプロバイダー向けの、狭いweb-search設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびスコープ付き認証情報setter/getterなどの狭いweb-search設定/認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | Web-searchプロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Geminiスキーマクリーンアップ + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などのxAI互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、ストリームラッパー型、および共有Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transportメッセージ変換、書き込み可能transportイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルsingleton/map/cacheヘルパー |
    | `plugin-sdk/group-activation` | 狭いグループ有効化モードおよびコマンド解析ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、コマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | approver解決および同一チャットのアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブexec承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認Gateway解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットなチャンネルエントリポイント向けの軽量ネイティブ承認アダプターロードヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い承認ハンドラーランタイムヘルパー。より狭いadapter/gatewayシームで足りる場合はそちらを優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin承認返信ペイロードヘルパー |
    | `plugin-sdk/reply-dedupe` | 狭い受信返信dedupeリセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広いtesting barrelなしの狭いチャンネル契約テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証 + ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットなチャンネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文正規化およびコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャンネル/Plugin secretサーフェス向けの狭いsecret契約収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret契約/設定解析向けの狭い `coerceSecretRef` およびSecretRef型ヘルパー |
    | `plugin-sdk/security-runtime` | 共有trust、DMゲーティング、external-content、およびsecret収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホストallowlistおよびプライベートネットワークSSRFポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広いinfraランタイムサーフェスなしの狭いpinned-dispatcherヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF保護付きfetch、およびSSRFポリシーヘルパー |
    | `plugin-sdk/secret-input` | secret入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhookリクエスト/ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエストボディサイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/runtime` | 広いランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイム環境、ロガー、タイムアウト、リトライ、およびバックオフヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用チャンネルランタイムコンテキスト登録および参照ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Pluginコマンド/フック/http/インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` などの遅延ランタイムimport/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセスexecヘルパー |
    | `plugin-sdk/cli-runtime` | CLI整形、待機、およびバージョンヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアントおよびチャンネルステータスパッチヘルパー |
    | `plugin-sdk/config-runtime` | 設定読み込み/書き込みヘルパーおよびPlugin設定参照ヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドル済みTelegram契約サーフェスが利用できない場合でも機能する、Telegramコマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広いtext-runtime barrelなしのファイル参照autolink検出 |
    | `plugin-sdk/approval-runtime` | exec/Plugin承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー |
    | `plugin-sdk/reply-runtime` | 共有受信/返信ランタイムヘルパー、チャンク化、dispatch、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い返信dispatch/finalizeおよび会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの共有短期間reply-historyヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いテキスト/Markdownチャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス + updated-atヘルパー |
    | `plugin-sdk/state-paths` | state/OAuthディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャンネル/アカウントステータス要約ヘルパー、ランタイムstateデフォルト、およびissueメタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | stdout/stderr結果を正規化したタイム付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLIパラメータリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化ペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信ターゲットフィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムロガーおよびredactionヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdownテーブルモードおよび変換ヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON state読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックdedupeキャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACPランタイム/セッションおよびreply-dispatchヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動importなしの読み取り専用ACPバインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭いエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩い真偽値パラメータリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名一致解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスbootstrapおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャンネル、ステータス、およびambient proxyヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skillsコマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/build/serializeヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的trusted-Pluginサーフェス: ハーネス型、active-run steer/abortヘルパー、OpenClawツールブリッジヘルパー、ツール進捗整形/詳細ヘルパー、および試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/Heartbeatヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模境界付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグおよびイベントヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、整形、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済みfetch、プロキシ、およびpinned lookupヘルパー |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch importなしのdispatcher対応ランタイムfetch |
    | `plugin-sdk/response-limit-runtime` | 広いmediaランタイムサーフェスなしの境界付きレスポンスボディリーダー |
    | `plugin-sdk/session-binding-runtime` | configured binding routingやpairing storesなしの現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広い設定書き込み/保守importなしのセッションストア読み取りヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広い設定/セキュリティimportなしのコンテキスト可視性解決および補助コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging importなしの狭いプリミティブrecord/文字列coerceおよび正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名およびSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定およびリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | エージェントディレクトリ/アイデンティティ/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定バックのディレクトリ照会/dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディアfetch/変換/保存ヘルパーとメディアペイロードビルダー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの狭いメディア保存ヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、およびモデル欠落メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向け画像/音声ヘルパーexport |
    | `plugin-sdk/text-runtime` | assistant-visible-text除去、Markdownレンダー/チャンク化/テーブルヘルパー、redactionヘルパー、directive-tagヘルパー、およびsafe-textユーティリティなどの共有テキスト/Markdown/ロギングヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けdirective、レジストリ、および検証ヘルパー |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、directive、および正規化ヘルパー |
    | `plugin-sdk/realtime-transcription` | realtime文字起こしプロバイダー型、レジストリヘルパー、および共有WebSocketセッションヘルパー |
    | `plugin-sdk/realtime-voice` | realtime音声プロバイダー型およびレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型 |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、およびレジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー参照、およびmodel-ref解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー参照、およびmodel-ref解析 |
    | `plugin-sdk/webhook-targets` | Webhookターゲットレジストリおよびroute-installヘルパー |
    | `plugin-sdk/webhook-path` | Webhookパス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | Plugin SDK利用者向けに再exportされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memoryサブパス">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLIヘルパー向けのバンドル済みmemory-coreヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホストfoundation engine exports |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホストembedding契約、レジストリアクセス、ローカルプロバイダー、および汎用batch/remoteヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホストQMD engine exports |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストstorage engine exports |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー |
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
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス用Active Memoryランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリホストステータスヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドル済みmemory-lancedbヘルパーサーフェス |
  </Accordion>

  <Accordion title="予約済みバンドル済みヘルパーサブパス">
    | Family | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドル済みbrowser Pluginサポートヘルパー（`browser-support` は互換barrelのままです） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドル済みMatrixヘルパー/ランタイムサーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドル済みLINEヘルパー/ランタイムサーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドル済みIRCヘルパーサーフェス |
    | チャンネル固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドル済みチャンネル互換/ヘルパーシーム |
    | 認証/Plugin固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドル済み機能/Pluginヘルパーシーム。`plugin-sdk/github-copilot-token` は現在、`DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をexportします |
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
