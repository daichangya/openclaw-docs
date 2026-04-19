---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` の警告が表示される場合があります'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` の警告が表示される場合があります'
    - Pluginを最新のプラグインアーキテクチャに更新しています
    - 外部のOpenClawプラグインをメンテナンスしています
sidebarTitle: Migrate to SDK
summary: 従来の後方互換レイヤーから最新のPlugin SDKへ移行する
title: Plugin SDK移行
x-i18n:
    generated_at: "2026-04-19T01:11:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK移行

OpenClawは、広範な後方互換レイヤーから、目的が明確で文書化されたインポートを備えた最新のプラグインアーキテクチャへ移行しました。あなたのプラグインが新しいアーキテクチャ以前に作られたものであれば、このガイドが移行に役立ちます。

## 何が変わるのか

以前のプラグインシステムでは、プラグインが単一のエントリポイントから必要なものを何でもインポートできる、広く開かれた2つのサーフェスが提供されていました。

- **`openclaw/plugin-sdk/compat`** — 数十ものヘルパーを再エクスポートする単一のインポートです。新しいプラグインアーキテクチャの構築中に、古いフックベースのプラグインを動作させ続けるために導入されました。
- **`openclaw/extension-api`** — 埋め込みエージェントランナーのようなホスト側ヘルパーへ、プラグインが直接アクセスできるようにするブリッジです。

これら2つのサーフェスは現在、どちらも**非推奨**です。実行時にはまだ動作しますが、新しいプラグインでは使用してはいけません。また、既存のプラグインは次のメジャーリリースで削除される前に移行する必要があります。

<Warning>
  後方互換レイヤーは、今後のメジャーリリースで削除されます。
  これらのサーフェスから引き続きインポートしているプラグインは、その時点で動作しなくなります。
</Warning>

## なぜ変更されたのか

以前のアプローチには問題がありました。

- **起動が遅い** — 1つのヘルパーをインポートすると、無関係なモジュールが数十個読み込まれていました
- **循環依存** — 広範な再エクスポートにより、インポートサイクルが簡単に作られていました
- **不明確なAPIサーフェス** — どのエクスポートが安定していて、どれが内部用なのかを判別する方法がありませんでした

最新のPlugin SDKはこれを解決します。各インポートパス（`openclaw/plugin-sdk/\<subpath\>`）は、明確な目的と文書化された契約を持つ、小さく自己完結したモジュールです。

バンドルされたチャネル向けの従来のプロバイダー便利シームも廃止されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、チャネル名付きのヘルパーシーム、および
`openclaw/plugin-sdk/telegram-core` のようなインポートは、安定したプラグイン契約ではなく、mono-repo内部向けのプライベートなショートカットでした。代わりに、細かく分割された汎用SDKサブパスを使用してください。バンドルされたプラグインワークスペース内では、プロバイダー所有のヘルパーをそのプラグイン自身の
`api.ts` または `runtime-api.ts` に置いてください。

現在のバンドル済みプロバイダーの例:

- Anthropicは、Claude固有のストリームヘルパーを自身の `api.ts` /
  `contract-api.ts` シームに保持しています
- OpenAIは、プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーを自身の `api.ts` に保持しています
- OpenRouterは、プロバイダービルダーとオンボーディング/設定ヘルパーを自身の
  `api.ts` に保持しています

## 移行方法

<Steps>
  <Step title="承認ネイティブハンドラーを capability facts に移行する">
    承認対応チャネルPluginは現在、`approvalCapability.nativeRuntime` と共有ランタイムコンテキストレジストリを通じて、ネイティブ承認動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の認証/配信を、従来の `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開チャネルPlugin契約から削除されました。
      `delivery` / `native` / `render` フィールドは `approvalCapability` へ移してください
    - `plugin.auth` はチャネルのログイン/ログアウトフロー専用として引き続き残ります。そこにある承認認証フックは、coreではもう読み取られません
    - クライアント、トークン、Boltアプリなどのチャネル所有ランタイムオブジェクトは、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ承認ハンドラーからプラグイン所有の再ルーティング通知を送信しないこと。実際の配信結果に基づく「別の場所へルーティングされた」通知は、現在coreが管理します
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、実際の
      `createPluginRuntime().channel` サーフェスを提供すること。部分的なスタブは拒否されます

    現在の承認capabilityレイアウトについては、`/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windowsラッパーのフォールバック動作を監査する">
    あなたのプラグインが `openclaw/plugin-sdk/windows-spawn` を使用している場合、未解決のWindows
    `.cmd` / `.bat` ラッパーは、明示的に `allowShellFallback: true` を渡さない限り、現在はフェイルクローズします。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // シェル経由のフォールバックを意図的に受け入れる、信頼された互換性呼び出し元に対してのみ設定します。
      allowShellFallback: true,
    });
    ```

    呼び出し元が意図的にシェルフォールバックに依存していない場合は、
    `allowShellFallback` を設定せず、代わりにスローされるエラーを処理してください。

  </Step>

  <Step title="非推奨のインポートを見つける">
    あなたのプラグインで、いずれかの非推奨サーフェスからのインポートを検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="目的別のインポートに置き換える">
    以前のサーフェスからの各エクスポートは、特定の最新インポートパスに対応しています。

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    ホスト側ヘルパーについては、直接インポートする代わりに、注入されたプラグインランタイムを使用してください。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他の従来のブリッジヘルパーにも当てはまります。

    | 旧インポート | 最新の対応先 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## インポートパスのリファレンス

  <Accordion title="よく使うインポートパステーブル">
  | Import path | 用途 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準のプラグインエントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリ定義/ビルダー向けの従来の包括的な再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダー用エントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 目的別に絞られたチャネルエントリ定義とビルダー | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共通のセットアップウィザードヘルパー | Allowlistプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | import-safeなセットアップパッチアダプター、lookup-noteヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, 委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | セットアップアダプターヘルパー | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | セットアップツール用ヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウント用ヘルパー | アカウント一覧/設定/アクションゲート用ヘルパー |
  | `plugin-sdk/account-id` | account-idヘルパー | `DEFAULT_ACCOUNT_ID`、account-id正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバック用ヘルパー |
  | `plugin-sdk/account-helpers` | 絞り込まれたアカウントヘルパー | アカウント一覧/アカウントアクション用ヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス + 入力中表示の配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリー | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | チャネル設定スキーマ型 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定ヘルパー | コマンド名正規化、説明文のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシーの解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウント状態の追跡 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | 受信エンベロープ用ヘルパー | 共通のルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/inbound-reply-dispatch` | 受信返信用ヘルパー | 共通の記録・ディスパッチヘルパー |
  | `plugin-sdk/messaging-targets` | メッセージ送信先の解析 | 送信先の解析/照合ヘルパー |
  | `plugin-sdk/outbound-media` | 送信メディア用ヘルパー | 共通の送信メディア読み込み |
  | `plugin-sdk/outbound-runtime` | 送信ランタイムヘルパー | 送信アイデンティティ/送信デリゲート用ヘルパー |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディング用ヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | 従来のメディアペイロードヘルパー | 従来のフィールドレイアウト向けエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | 従来のチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続的なプラグインストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 幅広いランタイムヘルパー | ランタイム/ロギング/バックアップ/プラグインインストール用ヘルパー |
  | `plugin-sdk/runtime-env` | 絞り込まれたランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフ用ヘルパー |
  | `plugin-sdk/plugin-runtime` | 共通のプラグインランタイムヘルパー | プラグインコマンド/フック/http/対話ヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプライン用ヘルパー | 共通のWebhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセス用ヘルパー | 共通のexecヘルパー |
  | `plugin-sdk/cli-runtime` | CLIランタイムヘルパー | コマンド整形、待機、バージョン用ヘルパー |
  | `plugin-sdk/gateway-runtime` | Gatewayヘルパー | Gatewayクライアントとチャネルステータスパッチ用ヘルパー |
  | `plugin-sdk/config-runtime` | 設定用ヘルパー | 設定の読み込み/書き込みヘルパー |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドヘルパー | バンドルされたTelegram契約サーフェスが利用できない場合の、フォールバックでも安定したTelegramコマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプト用ヘルパー | exec/プラグイン承認ペイロード、承認capability/プロファイル用ヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | approver解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアント用ヘルパー | ネイティブexec承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信用ヘルパー | ネイティブ承認capability/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gatewayヘルパー | 共通の承認Gateway解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットなチャネルエントリポイント向けの軽量なネイティブ承認アダプターロードヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。より細いadapter/gatewayシームで十分な場合はそちらを優先してください |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲット用ヘルパー | ネイティブ承認ターゲット/accountバインディング用ヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信用ヘルパー | exec/プラグイン承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルruntime-contextヘルパー | 汎用のチャネルruntime-context register/get/watchヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共通の信頼、DMゲーティング、外部コンテンツ、シークレット収集用ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーヘルパー | ホストallowlistとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムヘルパー | pinned-dispatcher、guarded fetch、SSRFポリシーヘルパー |
  | `plugin-sdk/collection-runtime` | 上限付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済みfetch/プロキシヘルパー | `resolveFetch`, プロキシヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`, ポリシーランナー |
  | `plugin-sdk/allow-from` | allowlist整形 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングとコマンドサーフェス用ヘルパー | `resolveControlCommandGate`, 送信者認可ヘルパー、コマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンド状態/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストヘルパー | Webhookターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhookボディガードヘルパー | リクエストボディの読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共通返信ランタイム | 受信ディスパッチ、Heartbeat、返信プランナー、チャンク分割 |
  | `plugin-sdk/reply-dispatch-runtime` | 絞り込まれた返信ディスパッチヘルパー | finalize + プロバイダーディスパッチヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴用ヘルパー | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンク用ヘルパー | テキスト/Markdownチャンク分割ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストア用ヘルパー | ストアパス + updated-atヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態ディレクトリとOAuthディレクトリのヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキー用ヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネル状態ヘルパー | チャネル/アカウント状態サマリービルダー、ランタイム状態デフォルト、issueメタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共通のターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | slug/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエストURLヘルパー | request風入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化されたstdout/stderrを持つ時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通のツール/CLIパラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化済みペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規の送信ターゲットフィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共通の一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーとリダクションヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdownテーブルヘルパー | Markdownテーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーセットアップヘルパー | セルフホスト型プロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | 目的別に絞られたOpenAI互換セルフホスト型プロバイダーセットアップヘルパー | 同じセルフホスト型プロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイムAPIキー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダーAPIキーセットアップヘルパー | APIキーのオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダーauth-resultヘルパー | 標準OAuth auth-resultビルダー |
  | `plugin-sdk/provider-auth-login` | プロバイダー対話型ログインヘルパー | 共通の対話型ログインヘルパー |
  | `plugin-sdk/provider-env-vars` | プロバイダーenv-varヘルパー | プロバイダー認証env-var検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共通のプロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共通のリプレイポリシービルダー、プロバイダーエンドポイントヘルパー、およびmodel-id正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共通のプロバイダーカタログヘルパー | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーのオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダーHTTPヘルパー | 汎用のプロバイダーHTTP/エンドポイントcapabilityヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダーweb-fetchヘルパー | web-fetchプロバイダーの登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダーweb-search設定ヘルパー | Plugin有効化配線を必要としないプロバイダー向けの、絞り込まれたweb-search設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダーweb-search契約ヘルパー | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き認証情報setter/getterなどの、絞り込まれたweb-search設定/認証情報契約ヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダーweb-searchヘルパー | web-searchプロバイダーの登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Geminiスキーマのクリーンアップ + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などのxAI互換ヘルパー |
  | `plugin-sdk/provider-usage` | プロバイダー使用状況ヘルパー | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、およびその他のプロバイダー使用状況ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共通のAnthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | guarded fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共通メディアヘルパー | メディアfetch/変換/保存ヘルパーに加え、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共通のメディア生成ヘルパー | 画像/動画/音楽生成向けの共通フェイルオーバーヘルパー、候補選択、モデル未設定メッセージング |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型に加え、プロバイダー向けの画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 共通テキストヘルパー | アシスタント可視テキストの除去、Markdownレンダリング/チャンク分割/テーブルヘルパー、リダクションヘルパー、directive-tagヘルパー、安全なテキストユーティリティ、および関連するテキスト/ロギングヘルパー |
  | `plugin-sdk/text-chunking` | テキストチャンク分割ヘルパー | 送信テキストのチャンク分割ヘルパー |
  | `plugin-sdk/speech` | Speechヘルパー | Speechプロバイダー型に加え、プロバイダー向けのdirective、registry、validationヘルパー |
  | `plugin-sdk/speech-core` | 共通Speechコア | Speechプロバイダー型、registry、directives、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型とregistryヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型とregistryヘルパー |
  | `plugin-sdk/image-generation-core` | 共通画像生成コア | 画像生成型、フェイルオーバー、認証、registryヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共通音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、model-ref解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共通動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダー検索、model-ref解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | チャネル設定プリミティブ | 絞り込まれたチャネルconfig-schemaプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャネル設定書き込みヘルパー | チャネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共通チャネルprelude | 共通チャネルプラグインpreludeエクスポート |
  | `plugin-sdk/channel-status` | チャネル状態ヘルパー | 共通チャネル状態スナップショット/サマリーヘルパー |
  | `plugin-sdk/allowlist-config-edit` | Allowlist設定ヘルパー | Allowlist設定の編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共通グループアクセス決定ヘルパー |
  | `plugin-sdk/direct-dm` | ダイレクトDMヘルパー | 共通ダイレクトDM認証/ガードヘルパー |
  | `plugin-sdk/extension-shared` | 共通拡張ヘルパー | 受動チャネル/状態およびambient proxyヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhookターゲットヘルパー | Webhookターゲットregistryおよびルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | Webhookパスヘルパー | Webhookパス正規化ヘルパー |
  | `plugin-sdk/web-media` | 共通webメディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | Zod再エクスポート | Plugin SDK利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | バンドル済みmemory-coreヘルパー | メモリマネージャー/設定/ファイル/CLIヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込み契約、registryアクセス、ローカルプロバイダー、および汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーはそれぞれの所有Pluginにあります |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホストQMDエンジン | メモリホストQMDエンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンのエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー | メモリホストイベントジャーナルヘルパー |
  | `plugin-sdk/memory-core-host-status` | メモリホスト状態ヘルパー | メモリホスト状態ヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホストCLIランタイム | メモリホストCLIランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | メモリホストコアランタイムヘルパー向けのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | メモリホストイベントジャーナルヘルパー向けのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイムエイリアス | メモリホストファイル/ランタイムヘルパー向けのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-markdown` | 管理対象Markdownヘルパー | メモリ隣接Plugin向けの共通managed-markdownヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory検索ファサード | 遅延読み込みされるActive Memory search-managerランタイムファサード |
  | `plugin-sdk/memory-host-status` | メモリホスト状態エイリアス | メモリホスト状態ヘルパー向けのベンダー中立エイリアス |
  | `plugin-sdk/memory-lancedb` | バンドル済みmemory-lancedbヘルパー | memory-lancedbヘルパーサーフェス |
  | `plugin-sdk/testing` | テストユーティリティ | テストヘルパーとモック |
</Accordion>

このテーブルは、完全なSDKサーフェスではなく、意図的に一般的な移行向けサブセットだけを示しています。200を超えるエントリポイントの完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` など、一部のバンドル済みプラグイン用ヘルパーシームも引き続き含まれています。これらは、バンドル済みプラグインの保守と互換性のために引き続きエクスポートされていますが、一般的な移行テーブルには意図的に含められておらず、新しいプラグインコードの推奨先ではありません。

同じルールは、次のような他のバンドル済みヘルパーファミリーにも当てはまります。

- ブラウザーサポートヘルパー: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` のような、バンドル済みヘルパー/プラグインサーフェス

`plugin-sdk/github-copilot-token` は現在、絞り込まれたトークンヘルパーサーフェス
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` を公開しています。

用途に合った最も狭いインポートを使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、Discordで質問してください。

## 削除スケジュール

| 時期 | 何が起きるか |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在** | 非推奨サーフェスは実行時警告を出します |
| **次のメジャーリリース** | 非推奨サーフェスは削除され、それらを引き続き使用しているプラグインは動作しなくなります |

すべてのcoreプラグインはすでに移行済みです。外部プラグインは、次のメジャーリリース前に移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避手段であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初のプラグインを作成する
- [SDK Overview](/ja-JP/plugins/sdk-overview) — サブパスインポートの完全なリファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネルPluginの作成
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — プロバイダーPluginの作成
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — マニフェストスキーマのリファレンス
