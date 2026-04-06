---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示された場合
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示された場合
    - plugin をモダンな plugin アーキテクチャへ更新している場合
    - 外部の OpenClaw plugin をメンテナンスしている場合
sidebarTitle: Migrate to SDK
summary: レガシーな後方互換レイヤーからモダンな plugin SDK へ移行する
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-04-06T04:44:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94f12d1376edd8184714cc4dbea4a88fa8ed652f65e9365ede6176f3bf441b33
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 移行

OpenClaw は、広範な後方互換レイヤーから、目的が明確で文書化された import を備えたモダンな plugin アーキテクチャへ移行しました。あなたの plugin が新しいアーキテクチャ以前に作られたものであれば、このガイドが移行の助けになります。

## 何が変わるのか

古い plugin システムでは、単一のエントリポイントから必要なものを何でも import できる、非常に広い 2 つのサーフェスが提供されていました。

- **`openclaw/plugin-sdk/compat`** — 数十のヘルパーを再エクスポートする単一の import。新しい plugin アーキテクチャの構築中に、古い hook ベースの plugin を動かし続けるために導入されました。
- **`openclaw/extension-api`** — 埋め込みエージェントランナーのような host 側ヘルパーへ plugin から直接アクセスできるようにするブリッジ。

これら 2 つのサーフェスは現在どちらも**非推奨**です。実行時には引き続き動作しますが、新しい plugin では使用してはいけません。また、既存の plugin は、次のメジャーリリースで削除される前に移行する必要があります。

<Warning>
  この後方互換レイヤーは、将来のメジャーリリースで削除されます。
  これらのサーフェスから import している plugin は、その時点で動作しなくなります。
</Warning>

## なぜ変更されたのか

古いアプローチには問題がありました。

- **起動が遅い** — 1 つのヘルパーを import すると、無関係な数十の module が読み込まれる
- **循環依存** — 広範な再エクスポートにより、import サイクルが簡単に発生する
- **不明確な API サーフェス** — どの export が安定していて、どれが内部用なのか判別できない

モダンな plugin SDK はこれを解決します。各 import path（`openclaw/plugin-sdk/\<subpath\>`）は、小さく自己完結した module であり、明確な目的と文書化された契約を持っています。

バンドルされた channel 向けのレガシーな provider 便利 seam も廃止されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、channel ブランド付きヘルパー seam、`openclaw/plugin-sdk/telegram-core` のような import は、安定した plugin 契約ではなく、mono-repo 内部向けのプライベートなショートカットでした。代わりに、汎用の狭い SDK subpath を使ってください。バンドルされた plugin workspace 内では、provider が所有するヘルパーはその plugin 自身の `api.ts` または `runtime-api.ts` に保持してください。

現在のバンドル済み provider の例:

- Anthropic は Claude 固有の stream ヘルパーを自身の `api.ts` / `contract-api.ts` seam に保持
- OpenAI は provider builder、default-model ヘルパー、realtime provider builder を自身の `api.ts` に保持
- OpenRouter は provider builder と onboarding/config ヘルパーを自身の `api.ts` に保持

## 移行方法

<Steps>
  <Step title="Windows wrapper の fallback 動作を監査する">
    あなたの plugin が `openclaw/plugin-sdk/windows-spawn` を使っている場合、解決できない Windows の
    `.cmd`/`.bat` wrapper は、明示的に
    `allowShellFallback: true` を渡さない限り、fail closed するようになりました。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // シェルを介した fallback を意図的に受け入れる、信頼された互換呼び出し元でのみ設定してください。
      allowShellFallback: true,
    });
    ```

    呼び出し元が意図的に shell fallback に依存していない場合は、
    `allowShellFallback` を設定せず、代わりに投げられた error を処理してください。

  </Step>

  <Step title="非推奨 import を見つける">
    あなたの plugin 内で、いずれかの非推奨サーフェスからの import を検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="目的別の import に置き換える">
    古いサーフェスの各 export は、特定のモダンな import path に対応しています。

    ```typescript
    // Before（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After（モダンで目的別の import）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host 側ヘルパーについては、直接 import するのではなく、注入された plugin runtime を使ってください。

    ```typescript
    // Before（非推奨の extension-api ブリッジ）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After（注入された runtime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーな bridge ヘルパーにも当てはまります。

    | 古い import | モダンな同等物 |
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

## import path リファレンス

<Accordion title="一般的な import path 一覧">
  | Import path | 用途 | 主な export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正式な plugin entry ヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | channel entry 定義 / builder 向けのレガシー umbrella 再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート config schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一 provider entry ヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 目的別の channel entry 定義と builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有 setup ウィザードヘルパー | Allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup 時 runtime ヘルパー | import-safe な setup patch adapter、lookup-note ヘルパー、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲 setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter ヘルパー | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling ヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数 account ヘルパー | account list/config/action-gate ヘルパー |
  | `plugin-sdk/account-id` | account-id ヘルパー | `DEFAULT_ACCOUNT_ID`、account-id 正規化 |
  | `plugin-sdk/account-resolution` | account lookup ヘルパー | account lookup と default-fallback ヘルパー |
  | `plugin-sdk/account-helpers` | 狭い account ヘルパー | account list / account-action ヘルパー |
  | `plugin-sdk/channel-setup` | setup ウィザード adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing プリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信 prefix と typing の配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | channel config schema 型 |
  | `plugin-sdk/telegram-command-config` | Telegram command config ヘルパー | command 名の正規化、description のトリミング、重複 / 競合の検証 |
  | `plugin-sdk/channel-policy` | group / DM policy 解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status 追跡 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | inbound envelope ヘルパー | 共有 route と envelope builder ヘルパー |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply ヘルパー | 共有 record-and-dispatch ヘルパー |
  | `plugin-sdk/messaging-targets` | messaging target 解析 | target の解析 / 照合ヘルパー |
  | `plugin-sdk/outbound-media` | outbound media ヘルパー | 共有 outbound media 読み込み |
  | `plugin-sdk/outbound-runtime` | outbound runtime ヘルパー | outbound identity / send delegate ヘルパー |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding ヘルパー | thread-binding lifecycle と adapter ヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシー media payload ヘルパー | レガシー field レイアウト向け agent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換 shim | レガシー channel runtime utility のみ |
  | `plugin-sdk/channel-send-result` | send result 型 | reply result 型 |
  | `plugin-sdk/runtime-store` | 永続的な plugin storage | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範な runtime ヘルパー | runtime / logging / backup / plugin-install ヘルパー |
  | `plugin-sdk/runtime-env` | 狭い runtime env ヘルパー | logger / runtime env、timeout、retry、backoff ヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有 plugin runtime ヘルパー | plugin commands / hooks / http / interactive ヘルパー |
  | `plugin-sdk/hook-runtime` | hook pipeline ヘルパー | 共有 webhook / internal hook pipeline ヘルパー |
  | `plugin-sdk/lazy-runtime` | lazy runtime ヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process ヘルパー | 共有 exec ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI runtime ヘルパー | command formatting、wait、version ヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway client と channel-status patch ヘルパー |
  | `plugin-sdk/config-runtime` | config ヘルパー | config load / write ヘルパー |
  | `plugin-sdk/telegram-command-config` | Telegram command ヘルパー | バンドルされた Telegram 契約サーフェスが使えない場合の、fallback-stable な Telegram command 検証ヘルパー |
  | `plugin-sdk/approval-runtime` | approval prompt ヘルパー | exec / plugin approval payload、approval capability / profile ヘルパー、native approval routing / runtime ヘルパー |
  | `plugin-sdk/approval-auth-runtime` | approval auth ヘルパー | approver 解決、同一 chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client ヘルパー | native exec approval profile / filter ヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery ヘルパー | native approval capability / delivery adapter |
  | `plugin-sdk/approval-native-runtime` | approval target ヘルパー | native approval target / account binding ヘルパー |
  | `plugin-sdk/approval-reply-runtime` | approval reply ヘルパー | exec / plugin approval reply payload ヘルパー |
  | `plugin-sdk/security-runtime` | security ヘルパー | 共有 trust、DM gating、external-content、secret-collection ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF policy ヘルパー | host allowlist と private-network policy ヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime ヘルパー | pinned-dispatcher、guarded fetch、SSRF policy ヘルパー |
  | `plugin-sdk/collection-runtime` | 制限付き cache ヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating ヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting ヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, error graph ヘルパー |
  | `plugin-sdk/fetch-runtime` | wrapped fetch / proxy ヘルパー | `resolveFetch`、proxy ヘルパー |
  | `plugin-sdk/host-runtime` | host 正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry ヘルパー | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist input mapping | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating と command-surface ヘルパー | `resolveControlCommandGate`、sender-authorization ヘルパー、command registry ヘルパー |
  | `plugin-sdk/secret-input` | secret input 解析 | secret input ヘルパー |
  | `plugin-sdk/webhook-ingress` | webhook request ヘルパー | webhook target utility |
  | `plugin-sdk/webhook-request-guards` | webhook body guard ヘルパー | request body read / limit ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有 reply runtime | inbound dispatch、heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 狭い reply dispatch ヘルパー | finalize と provider dispatch ヘルパー |
  | `plugin-sdk/reply-history` | reply-history ヘルパー | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk ヘルパー | text / markdown chunking ヘルパー |
  | `plugin-sdk/session-store-runtime` | session store ヘルパー | store path と updated-at ヘルパー |
  | `plugin-sdk/state-paths` | state path ヘルパー | state と OAuth dir ヘルパー |
  | `plugin-sdk/routing` | routing / session-key ヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、session-key 正規化ヘルパー |
  | `plugin-sdk/status-helpers` | channel status ヘルパー | channel / account status summary builder、runtime-state default、issue metadata ヘルパー |
  | `plugin-sdk/target-resolver-runtime` | target resolver ヘルパー | 共有 target resolver ヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | slug / 文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | request URL ヘルパー | request のような入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付き command ヘルパー | stdout / stderr を正規化した timed command runner |
  | `plugin-sdk/param-readers` | param reader | 一般的な tool / CLI param reader |
  | `plugin-sdk/tool-send` | tool send 抽出 | tool 引数から canonical send target field を抽出 |
  | `plugin-sdk/temp-path` | temp path ヘルパー | 共有 temp-download path ヘルパー |
  | `plugin-sdk/logging-core` | logging ヘルパー | subsystem logger と redaction ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | markdown-table ヘルパー | markdown table mode ヘルパー |
  | `plugin-sdk/reply-payload` | message reply 型 | reply payload 型 |
  | `plugin-sdk/provider-setup` | 厳選された local / self-hosted provider setup ヘルパー | self-hosted provider discovery / config ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | 目的別の OpenAI-compatible self-hosted provider setup ヘルパー | 同じ self-hosted provider discovery / config ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth ヘルパー | runtime API-key 解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup ヘルパー | API-key onboarding / profile-write ヘルパー |
  | `plugin-sdk/provider-auth-result` | provider auth-result ヘルパー | 標準 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login ヘルパー | 共有 interactive login ヘルパー |
  | `plugin-sdk/provider-env-vars` | provider env-var ヘルパー | provider auth env-var lookup ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有 provider model / replay ヘルパー | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有 replay-policy builder、provider-endpoint ヘルパー、model-id 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有 provider catalog ヘルパー | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider onboarding patch | onboarding config ヘルパー |
  | `plugin-sdk/provider-http` | provider HTTP ヘルパー | 汎用 provider HTTP / endpoint capability ヘルパー |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch ヘルパー | web-fetch provider registration / cache ヘルパー |
  | `plugin-sdk/provider-web-search` | provider web-search ヘルパー | web-search provider registration / cache / config ヘルパー |
  | `plugin-sdk/provider-tools` | provider tool / schema compat ヘルパー | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup と diagnostics、`resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI compat ヘルパー |
  | `plugin-sdk/provider-usage` | provider usage ヘルパー | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他の provider usage ヘルパー |
  | `plugin-sdk/provider-stream` | provider stream wrapper ヘルパー | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper 型、および共有 Anthropic / Bedrock / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot wrapper ヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有 media ヘルパー | media fetch / transform / store ヘルパーと media payload builder |
  | `plugin-sdk/media-generation-runtime` | 共有 media-generation ヘルパー | image / video / music generation 向けの共有 failover ヘルパー、candidate 選択、不足 model メッセージ |
  | `plugin-sdk/media-understanding` | media-understanding ヘルパー | media understanding provider 型と、provider 向け image / audio ヘルパー export |
  | `plugin-sdk/text-runtime` | 共有 text ヘルパー | assistant-visible-text の除去、markdown render / chunking / table ヘルパー、redaction ヘルパー、directive-tag ヘルパー、安全な text utility、関連する text / logging ヘルパー |
  | `plugin-sdk/text-chunking` | text chunking ヘルパー | outbound text chunking ヘルパー |
  | `plugin-sdk/speech` | speech ヘルパー | speech provider 型と、provider 向け directive、registry、validation ヘルパー |
  | `plugin-sdk/speech-core` | 共有 speech core | speech provider 型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription ヘルパー | provider 型と registry ヘルパー |
  | `plugin-sdk/realtime-voice` | realtime voice ヘルパー | provider 型と registry ヘルパー |
  | `plugin-sdk/image-generation-core` | 共有 image-generation core | image-generation 型、failover、auth、registry ヘルパー |
  | `plugin-sdk/music-generation` | music-generation ヘルパー | music-generation provider / request / result 型 |
  | `plugin-sdk/music-generation-core` | 共有 music-generation core | music-generation 型、failover ヘルパー、provider lookup、model-ref 解析 |
  | `plugin-sdk/video-generation` | video-generation ヘルパー | video-generation provider / request / result 型 |
  | `plugin-sdk/video-generation-core` | 共有 video-generation core | video-generation 型、failover ヘルパー、provider lookup、model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | interactive reply ヘルパー | interactive reply payload の正規化 / 縮約 |
  | `plugin-sdk/channel-config-primitives` | channel config プリミティブ | 狭い channel config-schema プリミティブ |
  | `plugin-sdk/channel-config-writes` | channel config-write ヘルパー | channel config-write authorization ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有 channel prelude | 共有 channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status ヘルパー | 共有 channel status snapshot / summary ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | allowlist config ヘルパー | allowlist config edit / read ヘルパー |
  | `plugin-sdk/group-access` | group access ヘルパー | 共有 group-access decision ヘルパー |
  | `plugin-sdk/direct-dm` | Direct-DM ヘルパー | 共有 direct-DM auth / guard ヘルパー |
  | `plugin-sdk/extension-shared` | 共有 extension ヘルパー | passive-channel / status helper プリミティブ |
  | `plugin-sdk/webhook-targets` | webhook target ヘルパー | webhook target registry と route-install ヘルパー |
  | `plugin-sdk/webhook-path` | webhook path ヘルパー | webhook path 正規化ヘルパー |
  | `plugin-sdk/web-media` | 共有 web media ヘルパー | remote / local media 読み込みヘルパー |
  | `plugin-sdk/zod` | Zod 再エクスポート | plugin SDK 利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | バンドルされた memory-core ヘルパー | Memory manager / config / file / CLI helper surface |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | Memory index / search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | Memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | Memory host embedding engine export |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | Memory host QMD engine export |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | Memory host storage engine export |
  | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal ヘルパー | Memory host multimodal ヘルパー |
  | `plugin-sdk/memory-core-host-query` | memory host query ヘルパー | Memory host query ヘルパー |
  | `plugin-sdk/memory-core-host-secret` | memory host secret ヘルパー | Memory host secret ヘルパー |
  | `plugin-sdk/memory-core-host-events` | memory host event journal ヘルパー | Memory host event journal ヘルパー |
  | `plugin-sdk/memory-core-host-status` | memory host status ヘルパー | Memory host status ヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | Memory host CLI runtime ヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | Memory host core runtime ヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host file / runtime ヘルパー | Memory host file / runtime ヘルパー |
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime ヘルパー向けの vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal ヘルパー向けの vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file / runtime alias | memory host file / runtime ヘルパー向けの vendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown ヘルパー | memory 隣接 plugin 向けの共有 managed-markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | active memory search facade | lazy な active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status ヘルパー向けの vendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | バンドルされた memory-lancedb ヘルパー | Memory-lancedb helper surface |
  | `plugin-sdk/testing` | テスト utility | テストヘルパーと mock |
</Accordion>

この表は、完全な SDK サーフェスではなく、意図的に一般的な移行向けのサブセットに絞っています。200 を超える entrypoint の完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json`
にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような、一部のバンドル plugin 用 helper seam も引き続き含まれています。これらはバンドル plugin の保守と互換性のために引き続き export されていますが、一般的な移行一覧には意図的に含めておらず、新しい plugin code の推奨先でもありません。

同じルールは、次のような他の bundled-helper ファミリーにも当てはまります。

- browser support ヘルパー: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、
  `plugin-sdk/mattermost*`、`plugin-sdk/msteams`、
  `plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、
  `plugin-sdk/twitch`、
  `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、
  `plugin-sdk/diagnostics-otel`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、
  `plugin-sdk/thread-ownership`、`plugin-sdk/voice-call` のような、バンドル helper / plugin サーフェス

`plugin-sdk/github-copilot-token` は現在、
`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken`
という狭い token-helper サーフェスを公開しています。

作業に合った、最も狭い import を使ってください。export が見つからない場合は、
`src/plugin-sdk/`
の source を確認するか、Discord で質問してください。

## 削除タイムライン

| 時期 | 何が起きるか |
| ---------------------- | ----------------------------------------------------------------------- |
| **今** | 非推奨サーフェスが実行時 warning を出す |
| **次のメジャーリリース** | 非推奨サーフェスは削除され、それらを使い続けている plugin は失敗する |

すべての core plugin はすでに移行済みです。外部 plugin は、次のメジャーリリース前に移行してください。

## warning を一時的に抑制する

移行作業中は、これらの environment variable を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避手段であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の plugin を作成する
- [SDK Overview](/ja-JP/plugins/sdk-overview) — subpath import の完全なリファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — channel plugin の作成
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider plugin の作成
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema リファレンス
