---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`警告が表示される'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED`警告が表示される'
    - Pluginを最新のPluginアーキテクチャへ更新している
    - 外部OpenClaw Pluginを保守している
sidebarTitle: Migrate to SDK
summary: 旧来の後方互換レイヤーから最新のPlugin SDKへ移行する
title: Plugin SDK移行
x-i18n:
    generated_at: "2026-04-22T04:25:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK移行

OpenClawは、広範な後方互換レイヤーから、焦点が絞られ文書化されたimportを持つ最新のPlugin
アーキテクチャへ移行しました。新しいアーキテクチャ以前に作られた
Pluginであれば、このガイドが移行に役立ちます。

## 何が変わるのか

旧Pluginシステムでは、Pluginが単一のエントリポイントから必要なものを
何でもimportできる、2つの大きく開かれたサーフェスが提供されていました。

- **`openclaw/plugin-sdk/compat`** — 数十の
  ヘルパーを再エクスポートする単一import。新しいPluginアーキテクチャの構築中に、
  旧来のhookベースPluginを動かし続けるために導入されました。
- **`openclaw/extension-api`** — 埋め込みagent runnerのような
  ホスト側ヘルパーへPluginが直接アクセスできるようにするブリッジ。

これら2つのサーフェスは現在どちらも**非推奨**です。ランタイムではまだ動作しますが、新しい
Pluginでは使用してはいけません。また既存Pluginも、次のメジャーリリースで削除される前に移行すべきです。

<Warning>
  この後方互換レイヤーは、将来のメジャーリリースで削除されます。
  これらのサーフェスからimportしているPluginは、その時点で壊れます。
</Warning>

## なぜこれが変わったのか

旧来のアプローチには問題がありました。

- **起動が遅い** — 1つのヘルパーをimportすると、無関係な多数のmoduleまで読み込まれる
- **循環依存** — 広範な再エクスポートにより、import cycleを簡単に作れてしまう
- **不明瞭なAPIサーフェス** — どのexportが安定版で、どれが内部用かを見分けられない

最新のPlugin SDKはこれを改善します。各import path（`openclaw/plugin-sdk/\<subpath\>`）
は、小さく自己完結したmoduleであり、明確な目的と文書化されたコントラクトを持ちます。

組み込みチャネル向けの旧来のprovider利便性seamも削除されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
チャネル名付きhelper seam、
および`openclaw/plugin-sdk/telegram-core`のようなimportは、安定したPluginコントラクトではなく、
mono-repo内部専用のショートカットでした。代わりに、細い汎用SDK subpathを使用してください。組み込み
Plugin workspace内では、provider所有のhelperはそのPlugin自身の
`api.ts`または`runtime-api.ts`に置いてください。

現在の組み込みproviderの例:

- Anthropicは、Claude固有のstream helperを自身の`api.ts` /
  `contract-api.ts` seamに保持
- OpenAIは、provider builder、default-model helper、realtime provider
  builderを自身の`api.ts`に保持
- OpenRouterは、provider builderとonboarding/config helperを自身の
  `api.ts`に保持

## 移行方法

<Steps>
  <Step title="承認ネイティブハンドラーをcapability factへ移行する">
    承認可能なチャネルPluginは現在、
    `approvalCapability.nativeRuntime`と共有runtime-context registryを通じて
    ネイティブ承認動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)`を
      `approvalCapability.nativeRuntime`に置き換える
    - 承認固有のauth/deliveryを旧来の`plugin.auth` /
      `plugin.approvals`配線から外し、`approvalCapability`へ移す
    - `ChannelPlugin.approvals`は公開チャネルPlugin
      コントラクトから削除されました。delivery/native/renderフィールドは`approvalCapability`へ移してください
    - `plugin.auth`はチャネルのlogin/logoutフロー専用として残ります。そこでの承認auth
      hookはもはやcoreから読まれません
    - clients、tokens、Bolt
      appsのようなチャネル所有runtime objectは`openclaw/plugin-sdk/channel-runtime-context`経由で登録する
    - ネイティブ承認ハンドラーからPlugin所有のreroute通知を送らないこと。
      実際のdelivery結果からのrouted-elsewhere通知は現在coreが担当します
    - `channelRuntime`を`createChannelManager(...)`へ渡すときは、
      実際の`createPluginRuntime().channel`サーフェスを提供してください。不完全なstubは拒否されます

    現在のapproval capability
    レイアウトについては`/plugins/sdk-channel-plugins`を参照してください。

  </Step>

  <Step title="Windows wrapperフォールバック動作を監査する">
    Pluginで`openclaw/plugin-sdk/windows-spawn`を使っている場合、
    解決できないWindowsの`.cmd`/`.bat` wrapperは、
    `allowShellFallback: true`を明示的に渡さない限り、現在はfail closedします。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 信頼できる互換性呼び出し元で、shell経由フォールバックを
      // 意図的に受け入れる場合にのみ設定してください。
      allowShellFallback: true,
    });
    ```

    呼び出し元がshellフォールバックに意図的に依存していない場合は、
    `allowShellFallback`を設定せず、代わりに投げられたエラーを処理してください。

  </Step>

  <Step title="非推奨importを見つける">
    Plugin内で、いずれかの非推奨サーフェスからのimportを検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="焦点の絞られたimportに置き換える">
    旧サーフェスの各exportは、特定の最新import pathに対応します。

    ```typescript
    // Before（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After（最新の焦点を絞ったimport）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    ホスト側helperについては、直接importする代わりに
    注入されたPlugin runtimeを使用してください。

    ```typescript
    // Before（非推奨のextension-api bridge）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After（注入されたruntime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは他の旧来bridge helperにも当てはまります。

    | Old import | Modern equivalent |
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

## import pathリファレンス

  <Accordion title="一般的なimport path一覧">
  | Import path | 目的 | 主なexports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規のPlugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルentry定義/builder向けの旧来umbrella再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマexport | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一provider entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 焦点を絞ったチャネルentry定義とbuilder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードhelper | allowlist prompt、セットアップステータスbuilder |
  | `plugin-sdk/setup-runtime` | セットアップ時runtime helper | import-safeなsetup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | セットアップadapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | セットアップツールhelper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウントhelper | account list/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 細いaccount helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | セットアップウィザードadapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および`DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリング基本機能 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信prefix + typing配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 設定adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマbuilder | チャネル設定スキーマ型 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定helper | コマンド名正規化、description切り詰め、重複/競合検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | accountステータスおよびdraft streamライフサイクルhelper | `createAccountStatusSink`、draft preview finalization helper |
  | `plugin-sdk/inbound-envelope` | 受信envelope helper | 共有route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | 受信返信helper | 共有record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | メッセージングtarget解析 | target解析/一致helper |
  | `plugin-sdk/outbound-media` | 送信media helper | 共有送信media読み込み |
  | `plugin-sdk/outbound-runtime` | 送信runtime helper | 送信identity/send delegateおよびpayload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングhelper | スレッドバインディングのライフサイクルとadapter helper |
  | `plugin-sdk/agent-media-payload` | 旧来media payload helper | 旧来フィールドレイアウト向けagent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換shim | 旧来のチャネルruntime utilityのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なruntime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 細いruntime env helper | logger/runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有Plugin runtime helper | Plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hookパイプラインhelper | 共有webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共有exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | コマンド整形、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway clientおよびchannel-status patch helper |
  | `plugin-sdk/config-runtime` | 設定helper | 設定load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドhelper | 組み込みTelegramコントラクトサーフェスが利用できない場合の、フォールバック安定なTelegramコマンド検証helper |
  | `plugin-sdk/approval-runtime` | 承認prompt helper | Exec/plugin approval payload、approval capability/profile helper、native approval routing/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | 承認auth helper | approver解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | 承認client helper | native exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | 承認delivery helper | native approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gateway helper | 共有approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認adapter helper | ホットなチャネルentrypoint向けの軽量native approval adapter読み込みhelper |
  | `plugin-sdk/approval-handler-runtime` | 承認handler helper | より広いapproval handler runtime helper。より細いadapter/gateway seamで十分ならそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | 承認target helper | native approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | 承認返信helper | Exec/plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | チャネルruntime-context helper | 汎用チャネルruntime-context register/get/watch helper |
  | `plugin-sdk/security-runtime` | セキュリティhelper | 共有trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーhelper | host allowlistおよびprivate-networkポリシーhelper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRFポリシーhelper |
  | `plugin-sdk/collection-runtime` | 境界付きcache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラー整形helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | ラップ済みfetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host正規化helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist整形 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドgatingおよびcommand-surface helper | `resolveControlCommandGate`, sender-authorization helper, command registry helper |
  | `plugin-sdk/command-status` | コマンドstatus/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret入力解析 | secret入力helper |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストhelper | Webhook target utility |
  | `plugin-sdk/webhook-request-guards` | Webhook本文guard helper | request body read/limit helper |
  | `plugin-sdk/reply-runtime` | 共有返信runtime | 受信dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 細いreply dispatch helper | finalize + provider dispatch helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | stateおよびOAuth dir helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key正規化helper |
  | `plugin-sdk/status-helpers` | チャネルstatus helper | channel/account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化helper | slug/string正規化helper |
  | `plugin-sdk/request-url` | Request URL helper | request相当入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドhelper | 正規化されたstdout/stderrを持つ時間制限付きコマンドrunner |
  | `plugin-sdk/param-readers` | param reader | 共通tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload抽出 | tool result objectから正規化payloadを抽出 |
  | `plugin-sdk/tool-send` | tool send抽出 | tool argsから正規のsend target fieldを抽出 |
  | `plugin-sdk/temp-path` | 一時path helper | 共有temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem loggerおよびredaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown-table helper | Markdown table mode helper |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | reply payload型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型providerセットアップhelper | セルフホスト型provider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 焦点を絞ったOpenAI互換セルフホスト型providerセットアップhelper | 同じセルフホスト型provider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key解決helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-keyセットアップhelper | API-keyオンボーディング/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider対話型login helper | 共有対話型login helper |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, shared replay-policy builder, provider-endpoint helper, およびmodel-id正規化helper |
  | `plugin-sdk/provider-catalog-shared` | 共有provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | providerオンボーディングpatch | オンボーディング設定helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | 汎用provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | Web-fetch provider register/cache helper |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search設定helper | Plugin有効化配線を必要としないprovider向けの、細いweb-search設定/認証情報helper |
  | `plugin-sdk/provider-web-search-contract` | provider web-searchコントラクトhelper | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、およびスコープ付き認証情報setter/getterのような、細いweb-search設定/認証情報コントラクトhelper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | Web-search provider register/cache/runtime helper |
  | `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Geminiスキーマcleanup + diagnostics、および`resolveXaiModelCompatPatch` / `applyXaiModelCompat`のようなxAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、およびその他のprovider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper型、および共有Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/provider-transport-runtime` | provider transport helper | guarded fetch、transport message transform、writable transport event streamのようなネイティブprovider transport helper |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有media helper | media fetch/transform/store helperとmedia payload builder |
  | `plugin-sdk/media-generation-runtime` | 共有media-generation helper | 共有failover helper、candidate選択、およびimage/video/music generation向けmissing-modelメッセージ |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider型とprovider向けimage/audio helper export |
  | `plugin-sdk/text-runtime` | 共有text helper | assistant-visible-text除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、safe-text utility、および関連するtext/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | 送信text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider型とprovider向けdirective、registry、validation helper |
  | `plugin-sdk/speech-core` | 共有speech core | speech provider型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider型とregistry helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider型とregistry helper |
  | `plugin-sdk/image-generation-core` | 共有image-generation core | image-generation型、failover、auth、registry helper |
  | `plugin-sdk/music-generation` | music-generation helper | music-generation provider/request/result型 |
  | `plugin-sdk/music-generation-core` | 共有music-generation core | music-generation型、failover helper、provider lookup、およびmodel-ref解析 |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result型 |
  | `plugin-sdk/video-generation-core` | 共有video-generation core | video-generation型、failover helper、provider lookup、およびmodel-ref解析 |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payloadの正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | channel config primitives | 細いchannel config-schema primitives |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write認可helper |
  | `plugin-sdk/channel-plugin-common` | 共有channel prelude | 共有channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共有channel status snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist設定helper | allowlist設定の編集/読み取りhelper |
  | `plugin-sdk/group-access` | group access helper | 共有group-access決定helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共有direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 共有extension helper | passive-channel/statusおよびambient proxy helper primitives |
  | `plugin-sdk/webhook-targets` | Webhook target helper | Webhook target registryおよびroute-install helper |
  | `plugin-sdk/webhook-path` | Webhook path helper | Webhook path正規化helper |
  | `plugin-sdk/web-media` | 共有web media helper | remote/local media読み込みhelper |
  | `plugin-sdk/zod` | Zod再エクスポート | Plugin SDK利用者向けに再エクスポートされた`zod` |
  | `plugin-sdk/memory-core` | 組み込みmemory-core helper | memory manager/config/file/CLI helperサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory embeddingコントラクト、registry access、local provider、および汎用batch/remote helper。具体的なremote providerはそれぞれの所有Pluginにあります |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | memory host QMD engine export |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | memory host storage engine export |
  | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal helper | memory host multimodal helper |
  | `plugin-sdk/memory-core-host-query` | memory host query helper | memory host query helper |
  | `plugin-sdk/memory-core-host-secret` | memory host secret helper | memory host secret helper |
  | `plugin-sdk/memory-core-host-events` | memory host event journal helper | memory host event journal helper |
  | `plugin-sdk/memory-core-host-status` | memory host status helper | memory host status helper |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | memory host CLI runtime helper |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | memory host core runtime helper |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host file/runtime helper | memory host file/runtime helper |
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helperのvendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helperのvendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file/runtime alias | memory host file/runtime helperのvendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory隣接Plugin向けの共有managed-markdown helper |
  | `plugin-sdk/memory-host-search` | Active Memory検索facade | lazy active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helperのvendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | 組み込みmemory-lancedb helper | memory-lancedb helperサーフェス |
  | `plugin-sdk/testing` | テストutility | テストhelperとmock |
</Accordion>

この表は、完全なSDK
サーフェスではなく、意図的に一般的な移行用サブセットです。200以上のentrypointからなる完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json`にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*`のような、組み込みPlugin用helper seamもまだ含まれています。これらは組み込みPluginの保守と互換性のために引き続きexportされていますが、一般的な移行表からは意図的に
省略されており、新しいPluginコードの推奨ターゲットではありません。

同じルールは、他の組み込みhelperファミリーにも適用されます。たとえば:

- browserサポートhelper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call`のような組み込みhelper/Pluginサーフェス

`plugin-sdk/github-copilot-token`は現在、細いtoken-helper
サーフェス`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken`を公開しています。

作業に合う最も細いimportを使ってください。exportが見つからない場合は、
`src/plugin-sdk/`のソースを確認するか、Discordで質問してください。

## 削除タイムライン

| When                   | What happens                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Now**                | 非推奨サーフェスはランタイム警告を出します                              |
| **Next major release** | 非推奨サーフェスは削除され、それをまだ使っているPluginは失敗します      |

すべてのcore Pluginはすでに移行済みです。外部Pluginは
次のメジャーリリース前に移行してください。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的なエスケープハッチであり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初のPluginを作る
- [SDK概要](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネルPluginの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider Pluginの構築
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schemaリファレンス
