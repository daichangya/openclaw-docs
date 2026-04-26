---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` の警告が表示されます'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` の警告が表示されます'
    - OpenClaw 2026.4.25 より前に `api.registerEmbeddedExtensionFactory` を使用していました
    - Plugin をモダンな plugin アーキテクチャに更新しています
    - 外部の OpenClaw plugin をメンテナンスしています
sidebarTitle: Migrate to SDK
summary: 従来の後方互換レイヤーから最新の Plugin SDK へ移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-04-26T11:36:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw は、幅広い後方互換レイヤーから、用途を絞って文書化された import を使うモダンな plugin アーキテクチャへ移行しました。あなたの plugin がこの新しいアーキテクチャ以前に作られている場合、このガイドが移行に役立ちます。

## 何が変わるのか

古い plugin システムでは、plugin が必要なものを単一のエントリーポイントから何でも import できる、非常に広い 2 つのサーフェスが提供されていました。

- **`openclaw/plugin-sdk/compat`** — 数十個のヘルパーを再エクスポートする単一の import。新しい plugin アーキテクチャの構築中に、古い hook ベースの plugin を動作させ続けるために導入されました。
- **`openclaw/extension-api`** — 組み込み agent runner などのホスト側ヘルパーに plugin から直接アクセスできるようにするブリッジ。
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` などの embedded-runner イベントを監視できた、削除済みの Pi 専用バンドル extension hook。

これらの広い import サーフェスは現在 **非推奨** です。ランタイムでは引き続き動作しますが、新しい plugin では使用してはいけません。既存の plugin も、次のメジャーリリースで削除される前に移行する必要があります。Pi 専用の embedded extension factory 登録 API は削除されました。代わりに tool-result middleware を使用してください。

OpenClaw では、置き換え手段を導入するのと同じ変更で、文書化された plugin の動作を削除したり再解釈したりすることはありません。契約を破る変更は、まず互換アダプター、診断、ドキュメント、非推奨期間を経る必要があります。これは SDK import、manifest フィールド、setup API、hook、ランタイム登録動作に適用されます。

<Warning>
  この後方互換レイヤーは、将来のメジャーリリースで削除されます。
  これらのサーフェスから import している plugin は、そのときに壊れます。
  Pi 専用の embedded extension factory 登録は、すでに読み込まれなくなっています。
</Warning>

## なぜこれが変更されたのか

古いアプローチには問題がありました。

- **起動が遅い** — 1 つのヘルパーを import すると、無関係な数十個の module まで読み込まれる
- **循環依存** — 広い再エクスポートにより import cycle が簡単に発生する
- **API サーフェスが不明確** — どの export が安定していて、どれが内部用なのか判断できない

モダンな plugin SDK はこれを解決します。各 import path（`openclaw/plugin-sdk/\<subpath\>`）は、小さく自己完結した module であり、明確な目的と文書化された契約を持ちます。

バンドルされた channel 向けの従来の provider 便利 seam も削除されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、channel ブランド付き helper seam、`openclaw/plugin-sdk/telegram-core` のような import は、安定した plugin 契約ではなく、mono-repo 内部のショートカットでした。代わりに、用途を絞った汎用 SDK subpath を使用してください。バンドル plugin の workspace 内では、provider 固有の helper はその plugin 自身の `api.ts` または `runtime-api.ts` に置いてください。

現在のバンドル provider の例:

- Anthropic は Claude 固有の stream helper を自身の `api.ts` / `contract-api.ts` seam に保持
- OpenAI は provider builder、default-model helper、realtime provider builder を自身の `api.ts` に保持
- OpenRouter は provider builder と onboarding/config helper を自身の `api.ts` に保持

## 互換性ポリシー

外部 plugin では、互換性対応は次の順序で進めます。

1. 新しい契約を追加する
2. 古い動作を互換アダプター経由で引き続き接続しておく
3. 古い path と置き換え先を明示した診断または警告を出す
4. 両方の path をテストでカバーする
5. 非推奨と移行パスを文書化する
6. 告知した移行期間が終わってから、通常はメジャーリリースで削除する

manifest フィールドがまだ受け入れられている場合、plugin 作者は docs と diagnostics が別の指示を出すまで、そのまま使い続けられます。新しいコードでは文書化された置き換え手段を優先すべきですが、既存の plugin が通常のマイナーリリース中に壊れてはいけません。

## 移行方法

<Steps>
  <Step title="Pi tool-result extension を middleware に移行する">
    バンドル plugin では、Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler を
    runtime に依存しない middleware に置き換える必要があります。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時に plugin manifest も更新してください。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 plugin は tool-result middleware を登録できません。これは、
    model が見る前の高信頼な tool 出力を書き換えられるためです。

  </Step>

  <Step title="approval ネイティブ handler を capability facts に移行する">
    approval 対応 channel plugin は現在、
    `approvalCapability.nativeRuntime` と共有の runtime-context registry を通じて
    ネイティブ approval 動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - approval 固有の auth/delivery を従来の `plugin.auth` /
      `plugin.approvals` 配線から外し、`approvalCapability` に移す
    - `ChannelPlugin.approvals` は公開 channel-plugin
      契約から削除されたため、delivery/native/render フィールドを `approvalCapability` に移す
    - `plugin.auth` は channel の login/logout フロー専用として残る。そこにある approval auth
      hook は、core ではもう参照されない
    - client、token、Bolt
      app など channel 所有の runtime object は `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ approval handler から plugin 所有の reroute notice を送信しないこと。
      core は現在、実際の delivery result に基づく routed-elsewhere notice を管理する
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実際の `createPluginRuntime().channel` サーフェスを提供すること。部分的な stub は拒否される

    現在の approval capability 構成については `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper の fallback 動作を監査する">
    あなたの plugin が `openclaw/plugin-sdk/windows-spawn` を使っている場合、
    解決できない Windows の `.cmd`/`.bat` wrapper は、明示的に `allowShellFallback: true` を渡さない限り、
    現在は fail closed になります。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // これは、意図的に shell 経由の fallback を受け入れる
      // 信頼済みの互換呼び出し元に対してのみ設定してください。
      allowShellFallback: true,
    });
    ```

    呼び出し元が意図的に shell fallback に依存していない場合は、
    `allowShellFallback` を設定せず、代わりに送出されるエラーを処理してください。

  </Step>

  <Step title="非推奨 import を見つける">
    あなたの plugin で、いずれかの非推奨サーフェスからの import を検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="用途を絞った import に置き換える">
    古いサーフェスの各 export は、特定のモダンな import path に対応しています。

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

    ホスト側 helper については、直接 import する代わりに、
    注入された plugin runtime を使用してください。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは他の従来の bridge helper にも適用されます。

    | 古い import | モダンな同等物 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helper | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import path リファレンス

  <Accordion title="一般的な import path テーブル">
  | Import path | 用途 | 主な export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正式な plugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | channel entry 定義/ builder 向けの従来の包括的な再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定 schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一 provider 用 entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 用途を絞った channel entry 定義と builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有 setup ウィザード helper | allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup 時の runtime helper | import-safe な setup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲 setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup ツール helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数 account 用 helper | account list/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id 正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 用途を絞った account helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | setup ウィザード adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing の基本要素 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix + typing の配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | 共有 channel config schema の基本要素。バンドル channel 名付き schema export は従来の互換性専用 |
  | `plugin-sdk/telegram-command-config` | Telegram command config helper | command 名の正規化、description のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | group/DM policy の解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status と draft stream lifecycle helper | `createAccountStatusSink`、draft preview finalization helper |
  | `plugin-sdk/inbound-envelope` | inbound envelope helper | 共有 route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply helper | 共有 record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | messaging target の解析 | target の解析/一致 helper |
  | `plugin-sdk/outbound-media` | outbound media helper | 共有 outbound media 読み込み |
  | `plugin-sdk/outbound-send-deps` | outbound send dependency helper | 完全な outbound runtime を import せずに使える軽量な `resolveOutboundSendDep` lookup |
  | `plugin-sdk/outbound-runtime` | outbound runtime helper | outbound delivery、identity/send delegate、session、formatting、payload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycle と adapter helper |
  | `plugin-sdk/agent-media-payload` | 従来の media payload helper | 従来の field layout 向け agent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換 shim | 従来の channel runtime utility のみ |
  | `plugin-sdk/channel-send-result` | send result 型 | reply result 型 |
  | `plugin-sdk/runtime-store` | 永続 plugin storage | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範な runtime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 用途を絞った runtime env helper | logger/runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有 plugin runtime helper | plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共有 webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共有 exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway client と channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram command helper | バンドルされた Telegram 契約サーフェスが利用できない場合の、fallback でも安定した Telegram command 検証 helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec/plugin approval payload、approval capability/profile helper、ネイティブ approval routing/runtime helper、構造化された approval 表示 path formatting |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver の解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | ネイティブ exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | ネイティブ approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval Gateway helper | 共有 approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helper | 高頻度に使われる channel entrypoint 向けの軽量なネイティブ approval adapter 読み込み helper |
  | `plugin-sdk/approval-handler-runtime` | approval handler helper | より広範な approval handler runtime helper。より狭い adapter/gateway seam で足りるならそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | approval target helper | ネイティブ approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec/plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | channel runtime-context helper | 汎用 channel runtime-context の register/get/watch helper |
  | `plugin-sdk/security-runtime` | security helper | 共有 trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlist と private-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | 上限付き cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`、error graph helper |
  | `plugin-sdk/fetch-runtime` | wrapped fetch/proxy helper | `resolveFetch`、proxy helper |
  | `plugin-sdk/host-runtime` | host 正規化 helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`、policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating と command-surface helper | `resolveControlCommandGate`、sender-authorization helper、動的引数メニュー formatting を含む command registry helper |
  | `plugin-sdk/command-status` | command status/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret input の解析 | secret input helper |
  | `plugin-sdk/webhook-ingress` | Webhook request helper | Webhook target utility |
  | `plugin-sdk/webhook-request-guards` | Webhook body guard helper | request body の読み取り/上限 helper |
  | `plugin-sdk/reply-runtime` | 共有 reply runtime | inbound dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 用途を絞った reply dispatch helper | finalize、provider dispatch、conversation-label helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | state と OAuth dir の helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、session-key 正規化 helper |
  | `plugin-sdk/status-helpers` | channel status helper | channel/account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有 target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化 helper | slug/文字列正規化 helper |
  | `plugin-sdk/request-url` | request URL helper | request 風入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付き command helper | stdout/stderr を正規化した timed command runner |
  | `plugin-sdk/param-readers` | param reader | 一般的な tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload 抽出 | tool result object から正規化済み payload を抽出 |
  | `plugin-sdk/tool-send` | tool send 抽出 | tool args から正規の send target field を抽出 |
  | `plugin-sdk/temp-path` | temp path helper | 共有 temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem logger と redaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown-table helper | Markdown table mode helper |
  | `plugin-sdk/reply-payload` | message reply 型 | reply payload 型 |
  | `plugin-sdk/provider-setup` | 厳選された local/self-hosted provider setup helper | self-hosted provider の discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 用途を絞った OpenAI-compatible self-hosted provider setup helper | 同じ self-hosted provider の discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key 解決 helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key オンボーディング/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準的な OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 共有 interactive login helper |
  | `plugin-sdk/provider-selection-runtime` | provider selection helper | configured-or-auto provider selection と生の provider config マージ |
  | `plugin-sdk/provider-env-vars` | Provider env-var helper | Provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有 provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有 replay-policy builder、provider-endpoint helper、model-id 正規化 helper |
  | `plugin-sdk/provider-catalog-shared` | 共有 provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider onboarding patch | オンボーディング config helper |
  | `plugin-sdk/provider-http` | Provider HTTP helper | audio transcription multipart form helper を含む、汎用 provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | Provider web-fetch helper | web-fetch provider の登録/cache helper |
  | `plugin-sdk/provider-web-search-config-contract` | Provider web-search config helper | plugin-enable 配線を必要としない provider 向けの、用途を絞った web-search config/credential helper |
  | `plugin-sdk/provider-web-search-contract` | Provider web-search contract helper | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き credential setter/getter などの、用途を絞った web-search config/credential contract helper |
  | `plugin-sdk/provider-web-search` | Provider web-search helper | web-search provider の登録/cache/runtime helper |
  | `plugin-sdk/provider-tools` | Provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema cleanup + diagnostics、`resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI compat helper |
  | `plugin-sdk/provider-usage` | Provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他の provider usage helper |
  | `plugin-sdk/provider-stream` | Provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper 型、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/provider-transport-runtime` | Provider transport helper | guarded fetch、transport message transform、書き込み可能な transport event stream などのネイティブ provider transport helper |
  | `plugin-sdk/keyed-async-queue` | 順序付き async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有 media helper | media fetch/transform/store helper と media payload builder |
  | `plugin-sdk/media-generation-runtime` | 共有 media-generation helper | image/video/music generation 向けの共有 failover helper、candidate selection、missing-model message |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider 型と provider 向け image/audio helper export |
  | `plugin-sdk/text-runtime` | 共有 text helper | assistant-visible-text の除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、safe-text utility、関連する text/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | outbound text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider 型と provider 向け directive、registry、validation helper |
  | `plugin-sdk/speech-core` | 共有 speech core | speech provider 型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider 型、registry helper、共有 WebSocket session helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider 型、registry/resolution helper、bridge session helper |
  | `plugin-sdk/image-generation-core` | 共有 image-generation core | image-generation 型、failover、auth、registry helper |
  | `plugin-sdk/music-generation` | music-generation helper | music-generation provider/request/result 型 |
  | `plugin-sdk/music-generation-core` | 共有 music-generation core | music-generation 型、failover helper、provider lookup、model-ref parsing |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result 型 |
  | `plugin-sdk/video-generation-core` | 共有 video-generation core | video-generation 型、failover helper、provider lookup、model-ref parsing |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload の正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | channel config の基本要素 | 用途を絞った channel config-schema の基本要素 |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write authorization helper |
  | `plugin-sdk/channel-plugin-common` | 共有 channel prelude | 共有 channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共有 channel status snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit/read helper |
  | `plugin-sdk/group-access` | group access helper | 共有 group-access decision helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共有 direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 共有 extension helper | passive-channel/status と ambient proxy helper の基本要素 |
  | `plugin-sdk/webhook-targets` | Webhook target helper | Webhook target registry と route-install helper |
  | `plugin-sdk/webhook-path` | Webhook path helper | Webhook path 正規化 helper |
  | `plugin-sdk/web-media` | 共有 web media helper | remote/local media 読み込み helper |
  | `plugin-sdk/zod` | Zod 再エクスポート | plugin SDK 利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | バンドルされた memory-core helper | memory manager/config/file/CLI helper サーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory embedding contract、registry access、local provider、汎用 batch/remote helper。具体的な remote provider はそれぞれの所有 plugin に置かれる |
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
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file/runtime alias | memory host file/runtime helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory に隣接する plugin 向けの共有 managed-markdown helper |
  | `plugin-sdk/memory-host-search` | Active Memory search facade | 遅延読み込みされる active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helper の vendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | バンドルされた memory-lancedb helper | memory-lancedb helper サーフェス |
  | `plugin-sdk/testing` | テスト utility | テスト helper と mock |
</Accordion>

このテーブルは、完全な SDK サーフェスではなく、意図的に一般的な移行向けサブセットだけを示しています。200 を超える entrypoint の完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` など、一部のバンドル plugin 用 helper seam も引き続き含まれています。これらはバンドル plugin の保守と互換性のために引き続き export されていますが、一般的な移行テーブルからは意図的に除外されており、新しい plugin コードの推奨先ではありません。

同じルールは、次のような他のバンドル helper ファミリーにも当てはまります。

- browser support helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  `plugin-sdk/voice-call` のような、バンドル helper/plugin サーフェス

`plugin-sdk/github-copilot-token` は現在、用途を絞った token-helper
サーフェス `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を公開しています。

作業内容に合った、最も用途を絞った import を使ってください。export が見つからない場合は、
`src/plugin-sdk/` の source を確認するか、Discord で質問してください。

## 現在の非推奨項目

plugin SDK、provider contract、runtime サーフェス、manifest 全体にまたがる、より狭い非推奨項目です。どれも現時点では引き続き動作しますが、将来のメジャーリリースで削除されます。各項目の下の説明では、古い API から正式な置き換え先への対応を示しています。

<AccordionGroup>
  <Accordion title="command-auth の help builder → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: シグネチャも
    export も同じで、より用途を絞った subpath から import するだけです。`command-auth`
    は互換 stub としてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helper → resolveInboundMentionDecision">
    **旧**: `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)`（
    `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` から）。

    **新**: `resolveInboundMentionDecision({ facts, policy })` — 2 つに分かれた呼び出しではなく、
    単一の decision object を返します。

    下流の channel plugin（Slack、Discord、Matrix、MS Teams）はすでに移行済みです。

  </Accordion>

  <Accordion title="Channel runtime shim と channel actions helper">
    `openclaw/plugin-sdk/channel-runtime` は古い
    channel plugin 向けの互換 shim です。新しいコードから import せず、
    runtime object の登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使ってください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` helper は、
    生の 「actions」 channel export とともに非推奨です。代わりに、意味論的な `presentation`
    サーフェスを通じて capability を公開してください。つまり channel plugin は、
    受け付ける生の action 名ではなく、何を render するか（card、button、select）を宣言します。

  </Accordion>

  <Accordion title="Web search provider の tool() helper → plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()`
    factory。

    **新**: provider plugin 上に `createTool(...)` を直接実装します。
    OpenClaw は、tool wrapper を登録するために SDK helper を必要としなくなりました。

  </Accordion>

  <Accordion title="プレーンテキスト channel envelope → BodyForAgent">
    **旧**: inbound channel message からフラットなプレーンテキストの prompt
    envelope を構築するための `formatInboundEnvelope(...)`（および
    `ChannelMessageForAgent.channelEnvelope`）。

    **新**: `BodyForAgent` と構造化された user-context block。
    channel plugin は、routing metadata（thread、topic、reply-to、reaction）を、
    prompt 文字列に連結するのではなく型付きフィールドとして付与します。
    `formatAgentEnvelope(...)` helper は、合成された
    assistant 向け envelope では引き続きサポートされていますが、inbound のプレーンテキスト envelope は
    廃止に向かっています。

    影響範囲: `inbound_claim`、`message_received`、および
    `channelEnvelope` テキストを後処理していたあらゆるカスタム
    channel plugin。

  </Accordion>

  <Accordion title="Provider discovery 型 → provider catalog 型">
    4 つの discovery 型 alias は現在、
    catalog 時代の型に対する薄い wrapper になっています。

    | 古い alias                 | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    加えて、従来の `ProviderCapabilities` static bag もあります。provider plugin は
    静的 object ではなく、provider runtime contract を通じて capability facts を
    付与するべきです。

  </Accordion>

  <Accordion title="Thinking policy hook → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の 3 つの別々の hook）:
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 単一の `resolveThinkingProfile(ctx)`。これは
    正式な `id`、省略可能な `label`、順位付きの level
    一覧を持つ `ProviderThinkingProfile` を返します。OpenClaw は、
    保存済みの古い値を profile の rank に基づいて自動的にダウングレードします。

    3 つではなく 1 つの hook を実装してください。従来の hook は
    非推奨期間中は引き続き動作しますが、profile の結果とは合成されません。

  </Accordion>

  <Accordion title="外部 OAuth provider fallback → contracts.externalAuthProviders">
    **旧**: plugin manifest で provider を宣言せずに
    `resolveExternalOAuthProfiles(...)` を実装すること。

    **新**: plugin manifest で `contracts.externalAuthProviders` を宣言し、
    **かつ** `resolveExternalAuthProfiles(...)` を実装します。古い 「auth
    fallback」 パスはランタイムで警告を出し、将来削除されます。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **旧** manifest フィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ env-var lookup を manifest の `setup.providers[].envVars`
    に反映してください。これにより setup/status 用の env metadata を 1 か所に集約でき、
    env-var lookup に答えるだけのために plugin runtime を起動せずに済みます。

    `providerAuthEnvVars` は、非推奨期間が終わるまでは互換アダプターを通じて
    引き続きサポートされます。

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **旧**: 3 つの別々の呼び出し —
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**: memory-state API 上の 1 回の呼び出し —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    スロットは同じで、登録呼び出しだけが 1 つになります。追加的な memory helper
    （`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`）は影響を受けません。

  </Accordion>

  <Accordion title="Subagent session message 型の名称変更">
    `src/plugins/runtime/types.ts` からは、2 つの従来の型 alias が
    まだ export されています。

    | 旧                           | 新                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method の `readSession` は、
    `getSessionMessages` を優先する形で非推奨になっています。シグネチャは同じで、
    古い method は新しい method を呼び出します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧**: `runtime.tasks.flow`（単数形）は、ライブな task-flow accessor を返していました。

    **新**: `runtime.tasks.flows`（複数形）は、DTO ベースの TaskFlow access を返します。
    これは import-safe で、完全な task runtime の読み込みを必要としません。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory → agent tool-result middleware">
    上の 「移行方法 → Pi tool-result extension を
    middleware に移行する」 で説明しています。ここでは完全性のために含めています。削除済みの Pi 専用
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` に明示的な runtime
    一覧を指定した `api.registerAgentToolResultMiddleware(...)` に置き換わります。
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は現在、
    `OpenClawConfig` の 1 行 alias です。正式な名前を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドル channel/provider plugin 内にある
extension レベルの非推奨項目は、それぞれの `api.ts` と `runtime-api.ts`
barrel 内で管理されています。これらはサードパーティ plugin の契約には影響しないため、
ここには記載していません。バンドル plugin のローカル barrel を直接利用している場合は、
アップグレード前にその barrel 内の非推奨コメントを確認してください。
</Note>

## 削除タイムライン

| 時期                   | 何が起こるか                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **今**                | 非推奨サーフェスがランタイム警告を出す                               |
| **次のメジャーリリース** | 非推奨サーフェスは削除され、それらをまだ使っている plugin は失敗する |

すべての core plugin はすでに移行済みです。外部 plugin は、
次のメジャーリリース前に移行する必要があります。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避手段であり、恒久的な解決策ではありません。

## 関連情報

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の plugin を作成する
- [SDK Overview](/ja-JP/plugins/sdk-overview) — subpath import の完全なリファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — channel plugin の作成
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider plugin の作成
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema リファレンス
