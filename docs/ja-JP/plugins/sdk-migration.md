---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告が表示される場合'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 警告が表示される場合'
    - OpenClaw 2026.4.25 より前に `api.registerEmbeddedExtensionFactory` を使用していた場合
    - Plugin を最新の Plugin アーキテクチャへ更新している場合
    - 外部 OpenClaw Plugin を保守している場合
sidebarTitle: Migrate to SDK
summary: レガシーな後方互換レイヤーから最新の Plugin SDK へ移行する
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-04-25T13:54:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw は、広範な後方互換レイヤーから、焦点が絞られ文書化された import を持つ最新の Plugin
アーキテクチャへ移行しました。Plugin が新しいアーキテクチャ以前に作られている場合、このガイドが移行に役立ちます。

## 何が変わるのか

古い Plugin システムは、1 つの entry point から必要なものを何でも import できる、
非常に広く開かれた 2 つの surface を提供していました。

- **`openclaw/plugin-sdk/compat`** — 数十の
  helper を再 export する単一 import。これは、新しい Plugin アーキテクチャの構築中も古い hook ベース Plugin を動作させるために導入されました。
- **`openclaw/extension-api`** — 埋め込み agent runner のような
  host 側 helper へ Plugin が直接アクセスできる bridge。
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` のような embedded-runner event を観測できた、削除済みの Pi 専用 bundled
  extension hook。

これらの広い import surface は現在 **deprecated** です。runtime ではまだ動作しますが、
新しい Plugin はこれらを使用してはならず、既存の Plugin も次の major release で削除される前に移行すべきです。  
Pi 専用の embedded extension factory
registration API はすでに削除されました。代わりに tool-result middleware を使用してください。

OpenClaw は、置き換え手段を導入するのと同じ変更の中で、文書化された Plugin 動作を削除または再解釈しません。
互換性を破る contract 変更は、まず compatibility adapter、diagnostics、docs、および deprecation window を経る必要があります。  
これは SDK import、manifest field、setup API、hook、および runtime
registration 動作に適用されます。

<Warning>
  後方互換レイヤーは、将来の major release で削除されます。  
  これらの surface から import している Plugin は、その時点で壊れます。  
  Pi 専用の embedded extension factory 登録は、すでに読み込まれません。
</Warning>

## なぜ変わったのか

古いアプローチは問題を引き起こしました。

- **起動が遅い** — 1 つの helper を import すると、無関係な数十の module が読み込まれていた
- **循環依存** — 広い再 export により、import cycle が簡単に生じていた
- **不明確な API surface** — どの export が stable で、どれが internal なのか判別できなかった

最新の Plugin SDK はこれを改善します。各 import path（`openclaw/plugin-sdk/\<subpath\>`）
は、小さく自己完結した module であり、明確な目的と文書化された contract を持ちます。

バンドル済み channel 向けの legacy provider convenience seam も削除されました。  
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
チャネル名付き helper seam、および
`openclaw/plugin-sdk/telegram-core` のような import は、stable な Plugin contract ではなく、
private な mono-repo shortcut でした。代わりに、狭い汎用 SDK subpath を使用してください。  
バンドル済み Plugin workspace 内では、provider 管理 helper はその Plugin 自身の
`api.ts` または `runtime-api.ts` に保持してください。

現在のバンドル済み provider の例:

- Anthropic は Claude 固有の stream helper を自分自身の `api.ts` /
  `contract-api.ts` seam に保持している
- OpenAI は provider builder、default-model helper、および realtime provider
  builder を自分自身の `api.ts` に保持している
- OpenRouter は provider builder および onboarding/config helper を自分自身の
  `api.ts` に保持している

## 互換性ポリシー

外部 Plugin に対しては、互換性対応は次の順序で進みます。

1. 新しい contract を追加する
2. 古い動作は compatibility adapter を通して動作し続けるようにする
3. 古い path と置き換え先を明示する diagnostic または warning を出す
4. 両方の経路をテストでカバーする
5. deprecation と移行経路を文書化する
6. 告知された移行期間の後、通常は major release でのみ削除する

manifest field がまだ受け付けられている場合、Plugin 作者は docs と diagnostics が別の指示を出すまで使い続けられます。  
新しいコードは文書化された置き換えを優先すべきですが、既存 Plugin は通常の minor release 中に壊れるべきではありません。

## 移行方法

<Steps>
  <Step title="Pi の tool-result extension を middleware へ移行する">
    バンドル済み Plugin は、Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler を
    runtime 非依存の middleware に置き換える必要があります。

    ```typescript
    // Pi と Codex ランタイムの dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時に Plugin manifest も更新してください。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 Plugin は tool-result middleware を登録できません。これは、
    モデルが見る前の高信頼な tool 出力を書き換えられてしまうためです。

  </Step>

  <Step title="approval-native handler を capability fact へ移行する">
    approval 対応 Channel Plugin は現在、
    `approvalCapability.nativeRuntime` と共有 runtime-context registry を通じて
    ネイティブ approval 動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - approval 固有の auth/delivery を legacy の `plugin.auth` /
      `plugin.approvals` 配線から外し、`approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開 channel-plugin
      contract から削除されたため、delivery/native/render field を `approvalCapability` へ移す
    - `plugin.auth` は channel login/logout flow のみに残る。そこにある approval auth
      hook は core ではもう読まれない
    - client、token、Bolt
      app のような channel 管理 runtime object は `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - プラグイン管理の reroute notice を native approval handler から送ってはいけない。core が現在、実際の delivery result から routed-elsewhere notice を管理する
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実際の `createPluginRuntime().channel` surface を渡すこと。部分的な stub は拒否される

    現在の approval capability
    layout は `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper fallback 動作を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使っている場合、
    未解決の Windows `.cmd`/`.bat` wrapper は、明示的に `allowShellFallback: true` を渡さない限り fail closed するようになりました。

    ```typescript
    // 変更前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 変更後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // シェル経由 fallback を意図的に受け入れる、信頼済みの互換呼び出し元に対してのみ設定する
      allowShellFallback: true,
    });
    ```

    呼び出し元が意図的に shell fallback に依存していない場合は、
    `allowShellFallback` を設定せず、代わりに throw された error を処理してください。

  </Step>

  <Step title="非推奨 import を見つける">
    Plugin 内で、いずれかの非推奨 surface から import している箇所を検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="焦点を絞った import に置き換える">
    古い surface の各 export は、特定の最新 import path に対応しています。

    ```typescript
    // 変更前（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 変更後（最新の焦点を絞った import）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host 側 helper については、直接 import する代わりに、
    注入された plugin runtime を使用してください。

    ```typescript
    // 変更前（非推奨の extension-api bridge）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 変更後（注入された runtime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは他の legacy bridge helper にも適用されます。

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

## Import path リファレンス

  <Accordion title="一般的な import path テーブル">
  | Import path | 用途 | 主な export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規の Plugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | channel entry definition/builder 向けのレガシー umbrella 再 export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマ export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一 provider entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 焦点を絞った channel entry definition と builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有 setup ウィザード helper | Allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup 時 runtime helper | import-safe な setup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲 setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウント helper | account list/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id 正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 狭い account helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | setup ウィザード adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing の基本要素 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix + typing 配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 設定 adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマ builder | 共有 channel 設定スキーマ primitive。バンドル済みチャネル名付きスキーマ export はレガシー互換専用 |
  | `plugin-sdk/telegram-command-config` | Telegram command 設定 helper | command 名正規化、description 切り詰め、重複/競合検証 |
  | `plugin-sdk/channel-policy` | group/DM policy 解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status と draft stream lifecycle helper | `createAccountStatusSink`, draft preview finalization helper |
  | `plugin-sdk/inbound-envelope` | inbound envelope helper | 共有 route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply helper | 共有 record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | messaging target 解析 | target parsing/matching helper |
  | `plugin-sdk/outbound-media` | outbound media helper | 共有 outbound media loading |
  | `plugin-sdk/outbound-runtime` | outbound runtime helper | outbound delivery、identity/send delegate、session、formatting、および payload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycle と adapter helper |
  | `plugin-sdk/agent-media-payload` | レガシー media payload helper | レガシー field layout 向け agent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換 shim | レガシー channel runtime utility のみ |
  | `plugin-sdk/channel-send-result` | send result 型 | reply result 型 |
  | `plugin-sdk/runtime-store` | 永続 Plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範な runtime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 狭い runtime env helper | logger/runtime env、timeout、retry、および backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有 Plugin runtime helper | Plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共有 webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共有 exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway client と channel-status patch helper |
  | `plugin-sdk/config-runtime` | 設定 helper | 設定 load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram command helper | バンドル済み Telegram contract surface が利用できないときの、fallback 安定な Telegram command 検証 helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec/plugin approval payload、approval capability/profile helper、native approval routing/runtime helper、および構造化 approval display path formatting |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver 解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | native exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | native approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval gateway helper | 共有 approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helper | hot channel entrypoint 向けの軽量 native approval adapter loading helper |
  | `plugin-sdk/approval-handler-runtime` | approval handler helper | より広範な approval handler runtime helper。adapter/gateway の狭い seam で足りる場合はそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | approval target helper | native approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec/plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | channel runtime-context helper | 汎用 channel runtime-context register/get/watch helper |
  | `plugin-sdk/security-runtime` | security helper | 共有 trust、DM gating、external-content、および secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlist と private-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | 境界付き cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | wrapped fetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host 正規化 helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist input mapping | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating と command-surface helper | `resolveControlCommandGate`, sender-authorization helper、dynamic argument menu formatting を含む command registry helper |
  | `plugin-sdk/command-status` | command status/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret input 解析 | secret input helper |
  | `plugin-sdk/webhook-ingress` | webhook request helper | webhook target utility |
  | `plugin-sdk/webhook-request-guards` | webhook body guard helper | request body read/limit helper |
  | `plugin-sdk/reply-runtime` | 共有 reply runtime | inbound dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 狭い reply dispatch helper | finalize、provider dispatch、および conversation-label helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | state と OAuth dir helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key 正規化 helper |
  | `plugin-sdk/status-helpers` | channel status helper | channel/account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有 target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化 helper | slug/string 正規化 helper |
  | `plugin-sdk/request-url` | request URL helper | request 風 input から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付き command helper | 正規化された stdout/stderr を持つ timed command runner |
  | `plugin-sdk/param-readers` | param reader | 共通 tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload 抽出 | tool result object から正規化された payload を抽出 |
  | `plugin-sdk/tool-send` | tool send 抽出 | tool args から正規の send target field を抽出 |
  | `plugin-sdk/temp-path` | temp path helper | 共有 temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem logger と redaction helper |
  | `plugin-sdk/markdown-table-runtime` | markdown-table helper | markdown table mode helper |
  | `plugin-sdk/reply-payload` | message reply 型 | reply payload 型 |
  | `plugin-sdk/provider-setup` | キュレートされたローカル/セルフホスト provider setup helper | セルフホスト provider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 焦点を絞った OpenAI-compatible セルフホスト provider setup helper | 同じセルフホスト provider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key 解決 helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider 対話ログイン helper | 共有対話ログイン helper |
  | `plugin-sdk/provider-selection-runtime` | provider selection helper | configured-or-auto provider selection と raw provider config merging |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有 provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有 replay-policy builder、provider-endpoint helper、および model-id 正規化 helper |
| `plugin-sdk/provider-catalog-shared` | 共有 provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | provider オンボーディング patch | オンボーディング設定 helper |
| `plugin-sdk/provider-http` | provider HTTP helper | audio transcription multipart form helper を含む、汎用 provider HTTP/endpoint capability helper |
| `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration/cache helper |
| `plugin-sdk/provider-web-search-config-contract` | provider web-search 設定 helper | Plugin enable 配線を必要としない provider 向けの、狭い web-search config/credential helper |
| `plugin-sdk/provider-web-search-contract` | provider web-search contract helper | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, およびスコープ付き credential setter/getter のような、狭い web-search config/credential contract helper |
| `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration/cache/runtime helper |
| `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI compat helper |
| `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, およびその他の provider usage helper |
| `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 型、および共有 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
| `plugin-sdk/provider-transport-runtime` | provider transport helper | guarded fetch、transport message transform、および writable transport event stream のようなネイティブ provider transport helper |
| `plugin-sdk/keyed-async-queue` | 順序付き async queue | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | 共有 media helper | media fetch/transform/store helper と media payload builder |
| `plugin-sdk/media-generation-runtime` | 共有 media-generation helper | image/video/music generation 向けの共有 failover helper、candidate selection、および missing-model messaging |
| `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider 型と、provider 向け image/audio helper export |
| `plugin-sdk/text-runtime` | 共有 text helper | assistant 可視テキスト除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全な text utility、および関連する text/logging helper |
| `plugin-sdk/text-chunking` | text chunking helper | outbound text chunking helper |
| `plugin-sdk/speech` | speech helper | speech provider 型と、provider 向け directive、registry、および validation helper |
| `plugin-sdk/speech-core` | 共有 speech core | speech provider 型、registry、directive、正規化 |
| `plugin-sdk/realtime-transcription` | realtime transcription helper | provider 型、registry helper、および共有 WebSocket session helper |
| `plugin-sdk/realtime-voice` | realtime voice helper | provider 型、registry/resolution helper、および bridge session helper |
| `plugin-sdk/image-generation-core` | 共有 image-generation core | image-generation 型、failover、auth、および registry helper |
| `plugin-sdk/music-generation` | music-generation helper | music-generation provider/request/result 型 |
| `plugin-sdk/music-generation-core` | 共有 music-generation core | music-generation 型、failover helper、provider lookup、および model-ref parsing |
| `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result 型 |
| `plugin-sdk/video-generation-core` | 共有 video-generation core | video-generation 型、failover helper、provider lookup、および model-ref parsing |
| `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload 正規化/縮約 |
| `plugin-sdk/channel-config-primitives` | channel 設定 primitive | 狭い channel config-schema primitive |
| `plugin-sdk/channel-config-writes` | channel 設定書き込み helper | channel config-write authorization helper |
| `plugin-sdk/channel-plugin-common` | 共有 channel prelude | 共有 channel plugin prelude export |
| `plugin-sdk/channel-status` | channel status helper | 共有 channel status snapshot/summary helper |
| `plugin-sdk/allowlist-config-edit` | allowlist 設定 helper | allowlist config edit/read helper |
| `plugin-sdk/group-access` | group access helper | 共有 group-access decision helper |
| `plugin-sdk/direct-dm` | direct-DM helper | 共有 direct-DM auth/guard helper |
| `plugin-sdk/extension-shared` | 共有 extension helper | passive-channel/status と ambient proxy helper primitive |
| `plugin-sdk/webhook-targets` | webhook target helper | webhook target registry と route-install helper |
| `plugin-sdk/webhook-path` | webhook path helper | webhook path 正規化 helper |
| `plugin-sdk/web-media` | 共有 web media helper | remote/local media loading helper |
| `plugin-sdk/zod` | Zod 再 export | Plugin SDK 利用者向けの `zod` 再 export |
| `plugin-sdk/memory-core` | バンドル済み memory-core helper | memory manager/config/file/CLI helper surface |
| `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
| `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
| `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory embedding contract、registry access、local provider、および汎用 batch/remote helper。具体的な remote provider は各 ownership Plugin 側に置く |
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
| `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helper の vendor 非依存 alias |
| `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helper の vendor 非依存 alias |
| `plugin-sdk/memory-host-files` | memory host file/runtime alias | memory host file/runtime helper の vendor 非依存 alias |
| `plugin-sdk/memory-host-markdown` | managed markdown helper | memory 隣接 Plugin 向けの共有 managed-markdown helper |
| `plugin-sdk/memory-host-search` | Active Memory search facade | lazy な Active Memory search-manager runtime facade |
| `plugin-sdk/memory-host-status` | memory host status alias | memory host status helper の vendor 非依存 alias |
| `plugin-sdk/memory-lancedb` | バンドル済み memory-lancedb helper | memory-lancedb helper surface |
| `plugin-sdk/testing` | テスト utility | test helper と mock |
</Accordion>

このテーブルは、完全な SDK
surface ではなく、意図的に一般的な移行用サブセットに絞っています。200 以上の entrypoint を含む完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、および `plugin-sdk/matrix*` のようなバンドル済み Plugin helper seam も含まれています。これらは
バンドル済み Plugin の保守と互換性のために引き続き export されていますが、一般的な移行テーブルからは意図的に
除外されており、新しい Plugin code の推奨先ではありません。

同じルールは、他の bundled-helper family にも適用されます。たとえば:

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
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` のような bundled helper/plugin surface

`plugin-sdk/github-copilot-token` は現在、狭い token-helper
surface `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、および `resolveCopilotApiToken` を公開しています。

作業に合った最も狭い import を使ってください。export が見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、Discord で質問してください。

## 現在有効な deprecation

plugin SDK、provider contract、
runtime surface、および manifest 全体にわたる、より狭い deprecation です。どれも現時点ではまだ動作しますが、将来の major release で削除されます。各項目の下に、古い API から正規の置き換え先への対応を示しています。

<AccordionGroup>
  <Accordion title="command-auth の help builder → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    export ですが、より狭い subpath から import します。`command-auth`
    は互換 stub としてそれらを再 export します。

    ```typescript
    // 変更前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 変更後
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helper → resolveInboundMentionDecision">
    **旧**: `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)` を
    `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` から使用。

    **新**: `resolveInboundMentionDecision({ facts, policy })` — 2 つに分かれた呼び出しではなく、
    1 つの decision object を返します。

    下流の channel Plugin（Slack、Discord、Matrix、MS Teams）はすでに
    切り替え済みです。

  </Accordion>

  <Accordion title="Channel runtime shim と channel actions helper">
    `openclaw/plugin-sdk/channel-runtime` は、古い
    channel Plugin 向けの互換 shim です。新しい code では import せず、
    runtime object の登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使ってください。

    `openclaw/plugin-sdk/channel-actions` 内の `channelActions*` helper は、
    生の「actions」channel export とともに deprecated です。代わりに意味論的な
    `presentation` surface を通じて capability を公開してください。つまり channel Plugin は、
    どの raw action 名を受け付けるかではなく、何を render するか
    （card、button、select）を宣言します。

  </Accordion>

  <Accordion title="Web search provider の tool() helper → Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` factory。

    **新**: provider Plugin 上で `createTool(...)` を直接実装する。
    OpenClaw はもはや tool wrapper を登録するために SDK helper を必要としません。

  </Accordion>

  <Accordion title="プレーンテキスト channel envelope → BodyForAgent">
    **旧**: 受信チャネルメッセージからフラットなプレーンテキスト prompt
    envelope を構築する `formatInboundEnvelope(...)`（および
    `ChannelMessageForAgent.channelEnvelope`）。

    **新**: `BodyForAgent` と構造化 user-context block。Channel
    Plugin は routing metadata（thread、topic、reply-to、reaction）を、
    prompt string に連結するのではなく typed field として添付します。
    合成された assistant 向け envelope 用の
    `formatAgentEnvelope(...)` helper は引き続きサポートされますが、inbound plaintext envelope は
    廃止に向かっています。

    影響範囲: `inbound_claim`、`message_received`、および
    `channelEnvelope` テキストを後処理していた任意の custom
    channel Plugin。

  </Accordion>

  <Accordion title="Provider discovery 型 → provider catalog 型">
    4 つの discovery 型 alias は現在、
    catalog 時代の型に対する薄い wrapper になっています。

    | Old alias                 | New type                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    加えて、レガシーな `ProviderCapabilities` の静的 bag もあります。provider Plugin は
    static object ではなく provider runtime contract を通じて capability fact を
    添付すべきです。

  </Accordion>

  <Accordion title="Thinking policy hook → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の 3 つの separate hook）:
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、および
    ランク付き level list を返す単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は古い保存済み値を profile
    rank に基づいて自動 downgrade します。

    3 つではなく 1 つの hook を実装してください。レガシー hook は deprecation window 中は引き続き動作しますが、
    profile result とは合成されません。

  </Accordion>

  <Accordion title="外部 OAuth provider fallback → contracts.externalAuthProviders">
    **旧**: plugin manifest で provider を宣言せずに
    `resolveExternalOAuthProfiles(...)` を実装する。

    **新**: plugin manifest で `contracts.externalAuthProviders` を宣言し、
    **さらに** `resolveExternalAuthProfiles(...)` を実装する。古い「auth
    fallback」経路は runtime で warning を出し、将来削除されます。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **旧** manifest field: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ env-var lookup を、manifest の `setup.providers[].envVars`
    にも反映させる。これにより setup/status env metadata を 1 か所に
    集約でき、env-var
    lookup に答えるだけのために Plugin runtime を起動する必要がなくなります。

    `providerAuthEnvVars` は、deprecation window が閉じるまでは compatibility adapter を通じて引き続きサポートされます。

  </Accordion>

  <Accordion title="Memory Plugin registration → registerMemoryCapability">
    **旧**: 3 つの separate call —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`。

    **新**: memory-state API 上の 1 回の呼び出し —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じ slot ですが、登録呼び出しは 1 つです。加算的な memory helper
    （`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`）には影響しません。

  </Accordion>

  <Accordion title="Subagent session message 型の改名">
    2 つのレガシー型 alias が、依然として `src/plugins/runtime/types.ts` から export されています。

    | Old                           | New                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method `readSession` は deprecated であり、
    `getSessionMessages` が新しい名前です。同じシグネチャで、旧 method は新しいものを呼び出します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧**: `runtime.tasks.flow`（単数）は、ライブな TaskFlow accessor を返していました。

    **新**: `runtime.tasks.flows`（複数）は DTO ベースの TaskFlow access を返します。これは import-safe であり、完全な task runtime の読み込みを必要としません。

    ```typescript
    // 変更前
    const flow = api.runtime.tasks.flow(ctx);
    // 変更後
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory → agent tool-result middleware">
    上の「移行方法 → Pi の tool-result extension を
    middleware へ移行する」で扱った内容です。完全性のため再掲すると、削除済みの Pi 専用
    `api.registerEmbeddedExtensionFactory(...)` 経路は、
    `contracts.agentToolResultMiddleware` に明示的な runtime
    list を持つ `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` から再 export されている `OpenClawSchemaType` は現在、
    `OpenClawConfig` の 1 行 alias です。正規名を優先してください。

    ```typescript
    // 変更前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 変更後
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドル済み channel/provider Plugin 内にある
extension レベルの deprecation は、それぞれの `api.ts` と `runtime-api.ts`
barrel 内で管理されています。これらはサードパーティ Plugin contract には影響せず、
ここには記載していません。バンドル済み Plugin のローカル barrel を直接利用している場合は、
アップグレード前にその barrel 内の deprecation comment を確認してください。
</Note>

## 削除タイムライン

| When                   | What happens                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **今**                 | 非推奨 surface は runtime warning を出す                                |
| **次の major release** | 非推奨 surface は削除され、それを使い続ける Plugin は失敗する          |

すべての core Plugin はすでに移行済みです。外部 Plugin は
次の major release 前に移行してください。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な escape hatch であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin を構築する
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — channel Plugin の構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider Plugin の構築
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest スキーマリファレンス
