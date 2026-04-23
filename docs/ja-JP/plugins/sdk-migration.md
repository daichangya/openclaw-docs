---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告が表示される場合'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 警告が表示される場合'
    - plugin をモダンな plugin アーキテクチャに更新している場合
    - 外部のOpenClaw pluginをメンテナンスしている場合
sidebarTitle: Migrate to SDK
summary: レガシー後方互換レイヤーからモダンな Plugin SDK へ移行する
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-04-23T04:48:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 移行

OpenClaw は、広範な後方互換レイヤーから、対象を絞った文書化済み import を持つモダンな plugin
アーキテクチャへ移行しました。新しい
アーキテクチャ以前に plugin を構築した場合、このガイドが移行に役立ちます。

## 何が変わるのか

古い plugin システムは、2つの大きく開かれた surface を提供しており、plugin が
必要なものを単一のエントリーポイントから何でも import できるようになっていました。

- **`openclaw/plugin-sdk/compat`** — 数十個の
  ヘルパーを再エクスポートする単一 import。これは、plugin
  アーキテクチャの新設中に、古いフックベース plugin を動作させ続けるために導入されました。
- **`openclaw/extension-api`** — plugin に
  組み込みエージェントランナーのようなホスト側ヘルパーへの直接アクセスを与えるブリッジ。

これら両方の surface は現在 **非推奨** です。ランタイムではまだ動作しますが、新しい
plugin は使ってはいけません。既存の plugin も、次のメジャーリリースで削除される前に移行する必要があります。

<Warning>
  この後方互換レイヤーは、将来のメジャーリリースで削除されます。
  これらの surface から import している plugin は、その時点で動作しなくなります。
</Warning>

## なぜ変わったのか

古いアプローチには問題がありました。

- **起動が遅い** — 1つのヘルパーを import すると、無関係な多数のモジュールまで読み込まれていました
- **循環依存** — 広範な再エクスポートにより、import cycle が簡単に発生していました
- **不明確な API surface** — どの export が安定で、どれが内部用かを判別する方法がありませんでした

モダンな Plugin SDK はこれを解決します。各 import パス（`openclaw/plugin-sdk/\<subpath\>`）
は、小さく自己完結したモジュールであり、明確な目的と文書化されたコントラクトを持ちます。

バンドルチャネル向けのレガシー provider 便利 seam も削除されました。
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
チャネル名付きヘルパー seam、および
`openclaw/plugin-sdk/telegram-core` のような import は、
安定した plugin コントラクトではなく、mono-repo 内部のプライベートショートカットでした。代わりに
汎用の狭い SDK subpath を使用してください。バンドル plugin ワークスペース内では、
provider が所有するヘルパーは、その plugin 自身の
`api.ts` または `runtime-api.ts` に置いてください。

現在のバンドル provider の例:

- Anthropic は Claude 固有のストリームヘルパーを自身の `api.ts` /
  `contract-api.ts` seam に保持しています
- OpenAI は provider ビルダー、default-model ヘルパー、realtime provider
  ビルダーを自身の `api.ts` に保持しています
- OpenRouter は provider ビルダーとオンボーディング/設定ヘルパーを自身の
  `api.ts` に保持しています

## 移行方法

<Steps>
  <Step title="承認ネイティブハンドラーを capability facts へ移行する">
    承認可能なチャネル plugin は現在、
    `approvalCapability.nativeRuntime` と共有ランタイムコンテキストレジストリを通じて、
    ネイティブ承認動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の auth/delivery を、レガシーな `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開チャネル plugin
      コントラクトから削除されました。delivery/native/render フィールドは `approvalCapability` に移してください
    - `plugin.auth` はチャネルの login/logout フロー専用として残ります。そこにある承認 auth
      フックは、もはや core では読み取られません
    - クライアント、トークン、Bolt
      アプリなど、チャネル所有のランタイムオブジェクトは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください
    - ネイティブ承認ハンドラーから plugin 所有の reroute notice を送信しないでください。
      core は現在、実際の配信結果からの routed-elsewhere notice を所有します
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実際の `createPluginRuntime().channel` surface を渡してください。部分的な stub は拒否されます。

    現在の承認 capability
    レイアウトについては、`/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows ラッパーのフォールバック動作を監査する">
    plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、
    解決不能な Windows `.cmd`/`.bat` ラッパーは、`allowShellFallback: true` を明示的に渡さない限り
    現在は closed-fail します。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 信頼できる互換性呼び出し元で、シェル経由のフォールバックを
      // 意図的に受け入れる場合にのみ設定してください。
      allowShellFallback: true,
    });
    ```

    呼び出し元がシェルフォールバックに意図的に依存していない場合は、
    `allowShellFallback` を設定せず、代わりに throw されたエラーを処理してください。

  </Step>

  <Step title="非推奨 import を探す">
    plugin 内で、いずれかの非推奨 surface からの import を検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="対象を絞った import に置き換える">
    古い surface の各 export は、特定のモダン import パスに対応します。

    ```typescript
    // Before（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After（対象を絞ったモダン import）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    ホスト側ヘルパーについては、直接 import する代わりに注入された plugin runtime を使用してください。

    ```typescript
    // Before（非推奨の extension-api ブリッジ）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After（注入された runtime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーブリッジヘルパーにも当てはまります。

    | 古い import | モダンな対応先 |
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

## import パスリファレンス

  <Accordion title="よく使う import パステーブル">
  | Import path | 用途 | 主な export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規の plugin エントリーヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリー定義/ビルダー向けのレガシーな包括的再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマ export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一 provider エントリーヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 対象を絞ったチャネルエントリー定義とビルダー | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共通セットアップウィザードヘルパー | allowlist プロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | import-safe なセットアップ patch アダプター、lookup-note ヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | セットアップアダプターヘルパー | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | セットアップツール用ヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウントヘルパー | アカウント一覧/設定/action-gate ヘルパー |
  | `plugin-sdk/account-id` | account-id ヘルパー | `DEFAULT_ACCOUNT_ID`, account-id 正規化 |
  | `plugin-sdk/account-resolution` | アカウント参照ヘルパー | アカウント参照 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 対象を絞ったアカウントヘルパー | アカウント一覧/account-action ヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM ペアリングの基本要素 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 応答プレフィックス + タイピング配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリー | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | チャネル設定スキーマ型 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド設定ヘルパー | コマンド名正規化、description のトリム、重複/競合検証 |
  | `plugin-sdk/channel-policy` | グループ/DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウント状態とドラフトストリームのライフサイクルヘルパー | `createAccountStatusSink`, ドラフトプレビュー完了ヘルパー |
  | `plugin-sdk/inbound-envelope` | 受信 envelope ヘルパー | 共通ルート + envelope ビルダーヘルパー |
  | `plugin-sdk/inbound-reply-dispatch` | 受信応答ヘルパー | 共通の記録 + dispatch ヘルパー |
  | `plugin-sdk/messaging-targets` | メッセージングターゲット解析 | ターゲット解析/照合ヘルパー |
  | `plugin-sdk/outbound-media` | 送信メディアヘルパー | 共通の送信メディア読み込み |
  | `plugin-sdk/outbound-runtime` | 送信ランタイムヘルパー | 送信 identity/send delegate と payload planning ヘルパー |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディア payload ヘルパー | レガシーフィールドレイアウト向けのエージェントメディア payload ビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換 shim | レガシーチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 応答結果型 |
  | `plugin-sdk/runtime-store` | 永続 plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 包括的ランタイムヘルパー | runtime/logging/backup/plugin-install ヘルパー |
  | `plugin-sdk/runtime-env` | 対象を絞ったランタイム env ヘルパー | logger/runtime env、timeout、retry、backoff ヘルパー |
  | `plugin-sdk/plugin-runtime` | 共通 plugin ランタイムヘルパー | plugin commands/hooks/http/interactive ヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共通 webhook/internal hook pipeline ヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共通 exec ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI ランタイムヘルパー | コマンド整形、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway クライアントと channel-status patch ヘルパー |
  | `plugin-sdk/config-runtime` | 設定ヘルパー | 設定の読み込み/書き込みヘルパー |
  | `plugin-sdk/telegram-command-config` | Telegram コマンドヘルパー | バンドルされた Telegram コントラクト surface が使えない場合の、フォールバックで安定した Telegram コマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | exec/plugin 承認 payload、approval capability/profile ヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー |
  | `plugin-sdk/approval-auth-runtime` | 承認 auth ヘルパー | approver 解決、同一チャット action auth |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ exec 承認 profile/filter ヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ approval capability/delivery アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認 Gateway ヘルパー | 共通承認 gateway-resolution ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットなチャネルエントリーポイント向けの軽量なネイティブ承認アダプターロードヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より包括的な承認ハンドラーランタイムヘルパー。より狭い adapter/gateway seam で十分な場合はそちらを優先してください |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/account binding ヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認応答ヘルパー | exec/plugin 承認応答 payload ヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネル runtime-context ヘルパー | 汎用チャネル runtime-context の register/get/watch ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共通の trust、DM gating、external-content、secret-collection ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF ポリシーヘルパー | ホスト allowlist と private-network ポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF ランタイムヘルパー | pinned-dispatcher、guarded fetch、SSRF ポリシーヘルパー |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, error graph ヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップされた fetch/proxy ヘルパー | `resolveFetch`, proxy ヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry ヘルパー | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist 整形 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングと command-surface ヘルパー | `resolveControlCommandGate`, sender-authorization ヘルパー, command registry ヘルパー |
  | `plugin-sdk/command-status` | コマンド状態/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhook リクエストヘルパー | Webhook ターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook body ガードヘルパー | リクエスト body の読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共通応答ランタイム | 受信 dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 対象を絞った応答 dispatch ヘルパー | finalize + provider dispatch ヘルパー |
  | `plugin-sdk/reply-history` | reply-history ヘルパー | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 応答参照 planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 応答チャンクヘルパー | テキスト/markdown chunking ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-at ヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態ディレクトリと OAuth ディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキー ヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネル状態ヘルパー | チャネル/アカウント状態サマリービルダー、runtime-state デフォルト、issue メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共通ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | slug/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | request 風入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | stdout/stderr が正規化された時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメータリーダー | 共通ツール/CLI パラメータリーダー |
  | `plugin-sdk/tool-payload` | ツール payload 抽出 | ツール結果オブジェクトから正規化された payload を抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規の送信ターゲットフィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共通の一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | logging ヘルパー | サブシステム logger と秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | markdown-table ヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ応答型 | 応答 payload 型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト provider セットアップヘルパー | セルフホスト provider の検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | 対象を絞った OpenAI 互換セルフホスト provider セットアップヘルパー | 同じセルフホスト provider 検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | provider ランタイム auth ヘルパー | ランタイム API-key 解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | provider API-key セットアップヘルパー | API-key オンボーディング/profile-write ヘルパー |
  | `plugin-sdk/provider-auth-result` | provider auth-result ヘルパー | 標準 OAuth auth-result ビルダー |
  | `plugin-sdk/provider-auth-login` | provider 対話型ログインヘルパー | 共通対話型ログインヘルパー |
  | `plugin-sdk/provider-env-vars` | provider env-var ヘルパー | provider auth env-var 参照ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共通 provider モデル/replay ヘルパー | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共通 replay-policy ビルダー、provider-endpoint ヘルパー、model-id 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共通 provider カタログヘルパー | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider オンボーディング patch | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | provider HTTP ヘルパー | 音声文字起こし用 multipart form ヘルパーを含む、汎用 provider HTTP/endpoint capability ヘルパー |
  | `plugin-sdk/provider-web-fetch` | provider Web fetch ヘルパー | Web fetch provider の登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | provider Web search 設定ヘルパー | plugin 有効化配線を必要としない provider 向けの、対象を絞った Web search 設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | provider Web search コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報 setter/getter などの、対象を絞った Web search 設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | provider Web search ヘルパー | Web search provider の登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | provider ツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマクリーンアップ + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換ヘルパー |
  | `plugin-sdk/provider-usage` | provider 使用量ヘルパー | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` などの provider 使用量ヘルパー |
  | `plugin-sdk/provider-stream` | provider ストリームラッパーヘルパー | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共通の Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | provider トランスポートヘルパー | guarded fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブ provider トランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共通メディアヘルパー | メディアの fetch/変換/保存ヘルパーに加えてメディア payload ビルダー |
  | `plugin-sdk/media-generation-runtime` | 共通メディア生成ヘルパー | 画像/動画/音楽生成向けの共通 failover ヘルパー、候補選択、model 不足メッセージング |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解 provider 型と provider 向け画像/音声ヘルパー export |
  | `plugin-sdk/text-runtime` | 共通テキストヘルパー | assistant 可視テキストの除去、markdown レンダリング/chunking/テーブルヘルパー、redaction ヘルパー、directive-tag ヘルパー、安全なテキストユーティリティ、および関連するテキスト/logging ヘルパー |
  | `plugin-sdk/text-chunking` | テキスト chunking ヘルパー | 送信テキスト chunking ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声 provider 型に加えて provider 向け directive、registry、検証ヘルパー |
  | `plugin-sdk/speech-core` | 共通音声コア | 音声 provider 型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | provider 型、registry ヘルパー、共通 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | provider 型と registry ヘルパー |
  | `plugin-sdk/image-generation-core` | 共通画像生成コア | 画像生成の型、failover、auth、registry ヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成 provider/request/result 型 |
  | `plugin-sdk/music-generation-core` | 共通音楽生成コア | 音楽生成の型、failover ヘルパー、provider 参照、model-ref 解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成 provider/request/result 型 |
  | `plugin-sdk/video-generation-core` | 共通動画生成コア | 動画生成の型、failover ヘルパー、provider 参照、model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ応答ヘルパー | インタラクティブ応答 payload の正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | チャネル設定プリミティブ | 対象を絞ったチャネル config-schema プリミティブ |
  | `plugin-sdk/channel-config-writes` | チャネル設定書き込みヘルパー | チャネル設定書き込みの認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共通チャネル前置き | 共通チャネル plugin 前置き export |
  | `plugin-sdk/channel-status` | チャネル状態ヘルパー | 共通チャネル状態スナップショット/サマリーヘルパー |
  | `plugin-sdk/allowlist-config-edit` | allowlist 設定ヘルパー | allowlist 設定の編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共通グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm` | ダイレクト DM ヘルパー | 共通ダイレクト DM auth/ガードヘルパー |
  | `plugin-sdk/extension-shared` | 共通拡張ヘルパー | passive-channel/status と ambient proxy ヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲット registry と route-install ヘルパー |
  | `plugin-sdk/webhook-path` | Webhook パスヘルパー | Webhook パス正規化ヘルパー |
  | `plugin-sdk/web-media` | 共通 Web メディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | Zod 再エクスポート | Plugin SDK 利用者向けに `zod` を再エクスポート |
  | `plugin-sdk/memory-core` | バンドルされた memory-core ヘルパー | メモリマネージャー/設定/ファイル/CLI ヘルパー surface |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリ index/search ランタイムファサード |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト foundation エンジン | メモリホスト foundation エンジン export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、registry アクセス、ローカル provider、汎用バッチ/リモートヘルパー。具体的なリモート provider はそれぞれの所有 plugin にあります |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジン | メモリホスト QMD エンジン export |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジン export |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー | メモリホストイベントジャーナルヘルパー |
  | `plugin-sdk/memory-core-host-status` | メモリホスト状態ヘルパー | メモリホスト状態ヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイム | メモリホスト CLI ランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイム別名 | memory host core ランタイムヘルパーのベンダー中立な別名 |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナル別名 | memory host event journal ヘルパーのベンダー中立な別名 |
  | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイム別名 | memory host file/runtime ヘルパーのベンダー中立な別名 |
  | `plugin-sdk/memory-host-markdown` | 管理対象 markdown ヘルパー | memory 隣接 plugin 向けの共通 managed-markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory 検索ファサード | 遅延 Active Memory search-manager ランタイムファサード |
  | `plugin-sdk/memory-host-status` | メモリホスト状態別名 | memory host status ヘルパーのベンダー中立な別名 |
  | `plugin-sdk/memory-lancedb` | バンドルされた memory-lancedb ヘルパー | memory-lancedb ヘルパー surface |
  | `plugin-sdk/testing` | テストユーティリティ | テストヘルパーとモック |
</Accordion>

このテーブルは、完全な Plugin SDK
surface ではなく、意図的によく使う移行サブセットだけを載せています。200件を超えるエントリーポイントの完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような、一部のバンドル plugin ヘルパー seam も引き続き含まれています。これらは
バンドル plugin のメンテナンスと互換性のために export されたままですが、意図的に
よく使う移行テーブルからは除外されており、新しい plugin コードの推奨対象ではありません。

同じルールは、次のような他のバンドルヘルパーファミリーにも適用されます。

- browser サポートヘルパー: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` のような、バンドルヘルパー/plugin surface

`plugin-sdk/github-copilot-token` は現在、対象を絞ったトークンヘルパー
surface である `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を公開しています。

作業に合った最も狭い import を使ってください。export が見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、Discord で質問してください。

## 削除タイムライン

| 時期 | 何が起こるか |
| ---------------------- | ----------------------------------------------------------------------- |
| **今** | 非推奨 surface がランタイム警告を出します |
| **次のメジャーリリース** | 非推奨 surface は削除され、それらをまだ使っている plugin は失敗します |

すべてのコア plugin はすでに移行済みです。外部 plugin は
次のメジャーリリース前に移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的なエスケープハッチであり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の plugin を作成する
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネル plugin の構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider plugin の構築
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — マニフェストスキーマリファレンス
