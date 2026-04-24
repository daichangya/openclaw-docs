---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`警告が表示される場合'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED`警告が表示される場合'
    - PluginをモダンなPluginアーキテクチャへ更新している場合
    - 外部OpenClaw Pluginを保守している場合
sidebarTitle: Migrate to SDK
summary: レガシーな後方互換レイヤーからモダンなPlugin SDKへ移行する
title: Plugin SDK移行
x-i18n:
    generated_at: "2026-04-24T09:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClawは、広範な後方互換レイヤーから、焦点が絞られ文書化されたimportを持つモダンなPluginアーキテクチャへ移行しました。あなたのPluginが新しいアーキテクチャ以前に作られたものであれば、このガイドが移行に役立ちます。

## 何が変わるのか

旧Pluginシステムは、単一のエントリポイントから必要なものを何でもimportできる、2つの広く開かれた面を提供していました。

- **`openclaw/plugin-sdk/compat`** — 数十のヘルパーを再エクスポートする単一import。新しいPluginアーキテクチャの構築中に、古いフックベースPluginを動かし続けるために導入されました。
- **`openclaw/extension-api`** — 組み込みエージェントランナーのようなホスト側ヘルパーへ、Pluginが直接アクセスできるようにするブリッジ。

これら両方の面は、現在**非推奨**です。ランタイムではまだ動作しますが、新しいPluginでは使ってはいけません。また、既存Pluginも次のメジャーリリースで削除される前に移行する必要があります。

OpenClawは、代替手段を導入する変更と同じ変更の中で、文書化済みPlugin挙動を削除したり再解釈したりしません。破壊的な契約変更は、まず互換アダプター、診断、ドキュメント、および非推奨期間を経る必要があります。これはSDK import、manifestフィールド、setup API、フック、ランタイム登録挙動に適用されます。

<Warning>
  後方互換レイヤーは将来のメジャーリリースで削除されます。
  それらの面からimportし続けるPluginは、その時点で壊れます。
</Warning>

## なぜ変わったのか

旧来のアプローチには問題がありました。

- **起動が遅い** — 1つのヘルパーをimportすると、無関係な数十のモジュールまで読み込まれていた
- **循環依存** — 広範な再エクスポートにより、import cycleを簡単に作れてしまった
- **API面が不明瞭** — どのexportが安定していて、どれが内部用なのか判別できなかった

モダンなPlugin SDKはこれを解決します。各importパス（`openclaw/plugin-sdk/\<subpath\>`）は、明確な目的と文書化された契約を持つ、小さく自己完結したモジュールです。

同梱チャネル向けのレガシープロバイダー利便シームも廃止されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、チャネル名付きヘルパーシーム、および`openclaw/plugin-sdk/telegram-core`のようなimportは、安定したPlugin契約ではなく、プライベートなmono-repoショートカットでした。代わりに、狭く汎用的なSDK subpathを使ってください。同梱Pluginワークスペース内では、プロバイダー所有ヘルパーをそのPlugin自身の`api.ts`または`runtime-api.ts`に置いてください。

現在の同梱プロバイダー例:

- Anthropicは、Claude固有のstream helperを自身の`api.ts` / `contract-api.ts`シームに保持している
- OpenAIは、provider builder、default-model helper、realtime provider builderを自身の`api.ts`に保持している
- OpenRouterは、provider builderとonboarding/config helperを自身の`api.ts`に保持している

## 互換性ポリシー

外部Plugin向けの互換性対応は、次の順序に従います。

1. 新しい契約を追加する
2. 旧挙動を互換アダプター経由で動かし続ける
3. 旧パスと置き換え先を明示した診断または警告を出す
4. 両方の経路をテストでカバーする
5. 非推奨化と移行経路を文書化する
6. 告知済みの移行期間後、通常はメジャーリリースでのみ削除する

manifestフィールドがまだ受理されるなら、Plugin作者はドキュメントと診断が別のことを言うまで使い続けられます。新規コードでは文書化された置き換え先を優先すべきですが、既存Pluginが通常のマイナーリリース中に壊れてはいけません。

## 移行方法

<Steps>
  <Step title="承認ネイティブハンドラーをcapability factsへ移行する">
    承認対応チャネルPluginは、現在、`approvalCapability.nativeRuntime`と共有ランタイムコンテキストレジストリを通じてネイティブ承認挙動を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)`を`approvalCapability.nativeRuntime`へ置き換える
    - 承認固有のauth/deliveryを、レガシーの`plugin.auth` / `plugin.approvals`配線から`approvalCapability`へ移す
    - `ChannelPlugin.approvals`は公開チャネルPlugin契約から削除された。delivery/native/renderフィールドは`approvalCapability`へ移す
    - `plugin.auth`は引き続きチャネルのlogin/logoutフロー専用。そこにある承認authフックは、もうcoreからは読まれない
    - クライアント、token、Bolt appのようなチャネル所有ランタイムオブジェクトは、`openclaw/plugin-sdk/channel-runtime-context`を通じて登録する
    - ネイティブ承認ハンドラーからPlugin所有のreroute noticeを送らないこと。coreは現在、実際のdelivery resultからrouted-elsewhere noticeを管理する
    - `channelRuntime`を`createChannelManager(...)`へ渡すときは、本物の`createPluginRuntime().channel`面を提供すること。部分的なstubは拒否される

    現在の承認capabilityレイアウトは`/plugins/sdk-channel-plugins`を参照してください。

  </Step>

  <Step title="Windows wrapperフォールバック挙動を監査する">
    あなたのPluginが`openclaw/plugin-sdk/windows-spawn`を使っている場合、解決できないWindowsの`.cmd`/`.bat` wrapperは、明示的に`allowShellFallback: true`を渡さない限り、現在はfail closedします。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // これを設定するのは、shell経由のフォールバックを意図的に受け入れる
      // 信頼済み互換呼び出し元だけにしてください。
      allowShellFallback: true,
    });
    ```

    呼び出し元がshellフォールバックへ意図的に依存していないなら、`allowShellFallback`は設定せず、代わりにthrowされるエラーを処理してください。

  </Step>

  <Step title="非推奨importを見つける">
    あなたのPlugin内で、どちらかの非推奨面からのimportを検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="焦点を絞ったimportへ置き換える">
    旧面からの各exportは、特定のモダンなimportパスへ対応付けられています。

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

    ホスト側ヘルパーについては、直接importする代わりに、注入されたPlugin runtimeを使ってください。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、ほかのレガシーブリッジヘルパーにも当てはまります。

    | Old import | モダンな置き換え |
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

## importパスリファレンス

  <Accordion title="よく使うimportパス一覧">
  | Import path | 用途 | 主なexport |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規のPlugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルentry定義/builder向けのレガシーumbrella再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマexport | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーentry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 焦点を絞ったチャネルentry定義とbuilder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有setupウィザードhelper | Allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup時ランタイムhelper | import-safeなsetup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setupツールhelper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントhelper | アカウント一覧/設定/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索helper | アカウント検索 + デフォルトfallback helper |
  | `plugin-sdk/account-helpers` | 狭いaccount helper | アカウント一覧/account-action helper |
  | `plugin-sdk/channel-setup` | setupウィザードadapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および`DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing基本機能 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信prefix + typing配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 設定adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマbuilder | チャネル設定スキーマ型 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定helper | コマンド名正規化、説明文トリミング、重複/競合検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウント状態およびドラフトstreamライフサイクルhelper | `createAccountStatusSink`、ドラフトプレビュー完了helper |
  | `plugin-sdk/inbound-envelope` | 受信envelope helper | 共有route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | 受信返信helper | 共有record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | メッセージ宛先解析 | 宛先解析/照合helper |
  | `plugin-sdk/outbound-media` | 送信メディアhelper | 共有送信メディア読み込み |
  | `plugin-sdk/outbound-runtime` | 送信ランタイムhelper | 送信ID/send delegateおよびpayload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | スレッドbinding helper | スレッドbindingライフサイクルとadapter helper |
  | `plugin-sdk/agent-media-payload` | レガシーメディアpayload helper | レガシーフィールドレイアウト向けエージェントメディアpayload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換shim | レガシーチャネルランタイムutilityのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムhelper | ランタイム/ログ/バックアップ/Pluginインストールhelper |
  | `plugin-sdk/runtime-env` | 狭いruntime env helper | logger/runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有Pluginランタイムhelper | Plugin command/hook/http/interactive helper |
  | `plugin-sdk/hook-runtime` | フックパイプラインhelper | 共有Webhook/内部フックパイプラインhelper |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムhelper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスhelper | 共有exec helper |
  | `plugin-sdk/cli-runtime` | CLIランタイムhelper | コマンド整形、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway clientおよびchannel-status patch helper |
  | `plugin-sdk/config-runtime` | 設定helper | 設定load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドhelper | 同梱Telegram契約面が利用できない場合のfallback安定Telegramコマンド検証helper |
  | `plugin-sdk/approval-runtime` | 承認prompt helper | exec/Plugin承認payload、承認capability/profile helper、ネイティブ承認routing/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | 承認auth helper | approver解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | 承認client helper | ネイティブexec承認profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | 承認delivery helper | ネイティブ承認capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gateway helper | 共有承認gateway解決helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認adapter helper | ホットチャネルentrypoint向け軽量ネイティブ承認adapter読み込みhelper |
  | `plugin-sdk/approval-handler-runtime` | 承認handler helper | より広い承認handlerランタイムhelper。より狭いadapter/gateway seamで足りるならそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | 承認target helper | ネイティブ承認target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | 承認返信helper | exec/Plugin承認返信payload helper |
  | `plugin-sdk/channel-runtime-context` | チャネルruntime-context helper | 汎用チャネルruntime-context register/get/watch helper |
  | `plugin-sdk/security-runtime` | セキュリティhelper | 共有trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーhelper | host allowlistおよびprivate-networkポリシーhelper |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムhelper | pinned-dispatcher、guarded fetch、SSRFポリシーhelper |
  | `plugin-sdk/collection-runtime` | 制限付きcache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | ラップされたfetch/proxy helper | `resolveFetch`、proxy helper |
  | `plugin-sdk/host-runtime` | host正規化helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | Allowlist整形 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドgatingおよびコマンド面helper | `resolveControlCommandGate`、送信者認可helper、コマンドregistry helper |
  | `plugin-sdk/command-status` | コマンドstatus/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret入力解析 | secret入力helper |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストhelper | Webhook target utility |
  | `plugin-sdk/webhook-request-guards` | Webhook本文guard helper | リクエスト本文read/limit helper |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | 受信dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 狭いreply dispatch helper | finalize、provider dispatch、conversation-label helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 返信参照planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | テキスト/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | セッションストアhelper | ストアpath + updated-at helper |
  | `plugin-sdk/state-paths` | 状態path helper | 状態およびOAuthディレクトリhelper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key正規化helper |
  | `plugin-sdk/status-helpers` | チャネルstatus helper | チャネル/アカウントstatus summary builder、runtime-stateデフォルト、issueメタデータhelper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化helper | slug/文字列正規化helper |
  | `plugin-sdk/request-url` | リクエストURL helper | request風入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドhelper | 正規化済みstdout/stderrを持つ時間制限付きコマンドrunner |
  | `plugin-sdk/param-readers` | param reader | 共通tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload抽出 | tool result objectから正規化payloadを抽出 |
  | `plugin-sdk/tool-send` | tool send抽出 | tool argsから正規のsend targetフィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時path helper | 共有一時ダウンロードpath helper |
  | `plugin-sdk/logging-core` | ログhelper | サブシステムloggerおよびredaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown-table helper | Markdown tableモードhelper |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信payload型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーsetup helper | セルフホスト型プロバイダー検出/設定helper |
  | `plugin-sdk/self-hosted-provider-setup` | 焦点を絞ったOpenAI互換セルフホスト型プロバイダーsetup helper | 同じセルフホスト型プロバイダー検出/設定helper |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイムauth helper | ランタイムAPIキー解決helper |
  | `plugin-sdk/provider-auth-api-key` | プロバイダーAPIキーsetup helper | API keyオンボーディング/profile-write helper |
  | `plugin-sdk/provider-auth-result` | プロバイダーauth-result helper | 標準OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | プロバイダー対話型login helper | 共有対話型login helper |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択helper | configured-or-autoプロバイダー選択および生プロバイダー設定マージ |
  | `plugin-sdk/provider-env-vars` | プロバイダーenv var helper | プロバイダーauth env var検索helper |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay-policy builder、provider-endpoint helper、およびmodel-id正規化helper |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログhelper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | プロバイダーオンボーディングpatch | オンボーディング設定helper |
| `plugin-sdk/provider-http` | プロバイダーHTTP helper | 音声文字起こし用multipart form helperを含む、汎用プロバイダーHTTP/endpoint capability helper |
| `plugin-sdk/provider-web-fetch` | プロバイダーweb-fetch helper | web-fetchプロバイダー登録/cache helper |
| `plugin-sdk/provider-web-search-config-contract` | プロバイダーweb-search設定helper | Plugin有効化配線を必要としないプロバイダー向けの、狭いweb-search設定/認証情報helper |
| `plugin-sdk/provider-web-search-contract` | プロバイダーweb-search契約helper | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、およびスコープ付き認証情報setter/getterのような、狭いweb-search設定/認証情報契約helper |
| `plugin-sdk/provider-web-search` | プロバイダーweb-search helper | web-searchプロバイダー登録/cache/runtime helper |
| `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Geminiスキーマクリーンアップ + 診断、および`resolveXaiModelCompatPatch` / `applyXaiModelCompat`のようなxAI互換helper |
| `plugin-sdk/provider-usage` | プロバイダー利用量helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、およびその他のプロバイダー利用量helper |
| `plugin-sdk/provider-stream` | プロバイダーストリームラッパーhelper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper型、および共有のAnthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilotラッパーhelper |
| `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートhelper | guarded fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームのようなネイティブプロバイダートランスポートhelper |
| `plugin-sdk/keyed-async-queue` | 順序付き非同期queue | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | 共有メディアhelper | メディアfetch/transform/store helperとメディアpayload builder |
| `plugin-sdk/media-generation-runtime` | 共有メディア生成helper | 共有failover helper、候補選択、画像/動画/音楽生成向けmissing-modelメッセージング |
| `plugin-sdk/media-understanding` | メディア理解helper | メディア理解プロバイダー型と、プロバイダー向け画像/音声helper export |
| `plugin-sdk/text-runtime` | 共有テキストhelper | アシスタント可視テキストの除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全なテキストutility、および関連するテキスト/ログhelper |
| `plugin-sdk/text-chunking` | テキストchunking helper | 送信テキストchunking helper |
| `plugin-sdk/speech` | Speech helper | Speechプロバイダー型と、プロバイダー向けdirective、registry、検証helper |
| `plugin-sdk/speech-core` | 共有speech core | Speechプロバイダー型、registry、directive、正規化 |
| `plugin-sdk/realtime-transcription` | リアルタイム文字起こしhelper | プロバイダー型、registry helper、および共有WebSocket session helper |
| `plugin-sdk/realtime-voice` | リアルタイム音声helper | プロバイダー型、registry/解決helper、およびbridge session helper |
| `plugin-sdk/image-generation-core` | 共有画像生成core | 画像生成型、failover、auth、およびregistry helper |
| `plugin-sdk/music-generation` | 音楽生成helper | 音楽生成プロバイダー/リクエスト/結果型 |
| `plugin-sdk/music-generation-core` | 共有音楽生成core | 音楽生成型、failover helper、プロバイダー検索、およびmodel-ref解析 |
| `plugin-sdk/video-generation` | 動画生成helper | 動画生成プロバイダー/リクエスト/結果型 |
| `plugin-sdk/video-generation-core` | 共有動画生成core | 動画生成型、failover helper、プロバイダー検索、およびmodel-ref解析 |
| `plugin-sdk/interactive-runtime` | 対話型返信helper | 対話型返信payload正規化/縮約 |
| `plugin-sdk/channel-config-primitives` | チャネル設定基本機能 | 狭いチャネルconfig-schema基本機能 |
| `plugin-sdk/channel-config-writes` | チャネルconfig-write helper | チャネルconfig-write認可helper |
| `plugin-sdk/channel-plugin-common` | 共有チャネルprelude | 共有チャネルPlugin prelude export |
| `plugin-sdk/channel-status` | チャネルstatus helper | 共有チャネルstatusスナップショット/summary helper |
| `plugin-sdk/allowlist-config-edit` | Allowlist設定helper | Allowlist設定edit/read helper |
| `plugin-sdk/group-access` | グループアクセスhelper | 共有group-access判定helper |
| `plugin-sdk/direct-dm` | ダイレクトDM helper | 共有ダイレクトDM auth/guard helper |
| `plugin-sdk/extension-shared` | 共有拡張helper | passive-channel/statusおよびambient proxy helper基本機能 |
| `plugin-sdk/webhook-targets` | Webhook target helper | Webhook target registryおよびroute-install helper |
| `plugin-sdk/webhook-path` | Webhook path helper | Webhook path正規化helper |
| `plugin-sdk/web-media` | 共有webメディアhelper | リモート/ローカルメディア読み込みhelper |
| `plugin-sdk/zod` | Zod再エクスポート | Plugin SDK利用者向けに再エクスポートされた`zod` |
| `plugin-sdk/memory-core` | 同梱memory-core helper | メモリマネージャー/設定/ファイル/CLI helper面 |
| `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムfacade | メモリindex/searchランタイムfacade |
| `plugin-sdk/memory-core-host-engine-foundation` | メモリhost foundation engine | メモリhost foundation engine export |
| `plugin-sdk/memory-core-host-engine-embeddings` | メモリhost embedding engine | メモリembedding契約、registryアクセス、ローカルプロバイダー、および汎用batch/remote helper。具体的なremoteプロバイダーは各所有Pluginにある |
| `plugin-sdk/memory-core-host-engine-qmd` | メモリhost QMD engine | メモリhost QMD engine export |
| `plugin-sdk/memory-core-host-engine-storage` | メモリhost storage engine | メモリhost storage engine export |
| `plugin-sdk/memory-core-host-multimodal` | メモリhostマルチモーダルhelper | メモリhostマルチモーダルhelper |
| `plugin-sdk/memory-core-host-query` | メモリhost query helper | メモリhost query helper |
| `plugin-sdk/memory-core-host-secret` | メモリhost secret helper | メモリhost secret helper |
| `plugin-sdk/memory-core-host-events` | メモリhostイベントジャーナルhelper | メモリhostイベントジャーナルhelper |
| `plugin-sdk/memory-core-host-status` | メモリhost status helper | メモリhost status helper |
| `plugin-sdk/memory-core-host-runtime-cli` | メモリhost CLIランタイム | メモリhost CLIランタイムhelper |
| `plugin-sdk/memory-core-host-runtime-core` | メモリhost coreランタイム | メモリhost coreランタイムhelper |
| `plugin-sdk/memory-core-host-runtime-files` | メモリhost file/runtime helper | メモリhost file/runtime helper |
| `plugin-sdk/memory-host-core` | メモリhost coreランタイムalias | メモリhost coreランタイムhelper向けのvendor-neutral alias |
| `plugin-sdk/memory-host-events` | メモリhostイベントジャーナルalias | メモリhostイベントジャーナルhelper向けのvendor-neutral alias |
| `plugin-sdk/memory-host-files` | メモリhost file/runtime alias | メモリhost file/runtime helper向けのvendor-neutral alias |
| `plugin-sdk/memory-host-markdown` | 管理対象markdown helper | メモリ隣接Plugin向けの共有管理対象markdown helper |
| `plugin-sdk/memory-host-search` | Active Memory検索facade | 遅延Active Memory search-managerランタイムfacade |
| `plugin-sdk/memory-host-status` | メモリhost status alias | メモリhost status helper向けのvendor-neutral alias |
| `plugin-sdk/memory-lancedb` | 同梱memory-lancedb helper | memory-lancedb helper面 |
| `plugin-sdk/testing` | テストutility | テストhelperおよびmock |
</Accordion>

この表は、意図的に共通の移行用サブセットであり、SDK全面ではありません。200以上あるentrypointの完全な一覧は`scripts/lib/plugin-sdk-entrypoints.json`にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*`のような、同梱Plugin用ヘルパーシームもまだ含まれています。これらは同梱Pluginの保守と互換性のために引き続きexportされていますが、意図的に共通移行表からは除外されており、新しいPluginコードの推奨ターゲットではありません。

同じルールは、次のような他の同梱ヘルパーファミリーにも適用されます。

- browserサポートhelper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`、`plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、`plugin-sdk/mattermost*`、`plugin-sdk/msteams`、`plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、`plugin-sdk/twitch`、`plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、`plugin-sdk/diagnostics-otel`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、`plugin-sdk/thread-ownership`、`plugin-sdk/voice-call`のような、同梱helper/Plugin面

`plugin-sdk/github-copilot-token`は現在、狭いtoken-helper面である`DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken`を公開しています。

作業に合った、できるだけ狭いimportを使ってください。exportが見つからない場合は、`src/plugin-sdk/`のソースを確認するか、Discordで質問してください。

## 削除タイムライン

| 時期 | 何が起こるか |
| --- | --- |
| **今** | 非推奨の面がランタイム警告を出す |
| **次のメジャーリリース** | 非推奨の面が削除され、それらを使い続けるPluginは失敗する |

すべてのcore Pluginはすでに移行済みです。外部Pluginは次のメジャーリリース前に移行してください。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な退避手段であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初のPluginを作る
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネルPluginの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — プロバイダーPluginの構築
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifestスキーマリファレンス
