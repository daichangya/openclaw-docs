---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED警告が表示されている
    - OPENCLAW_EXTENSION_API_DEPRECATED警告が表示されている
    - pluginをモダンなpluginアーキテクチャへ更新している
    - 外部OpenClaw pluginを保守している
sidebarTitle: Migrate to SDK
summary: legacy後方互換レイヤーからモダンなplugin SDKへ移行する
title: Plugin SDK Migration
x-i18n:
    generated_at: "2026-04-05T12:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c420b8d7de17aee16c5aa67e3a88da5750f0d84b07dd541f061081080e081196
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK Migration

OpenClawは、広範な後方互換レイヤーから、目的ごとに分かれた文書化済みimportを持つモダンなplugin
アーキテクチャへ移行しました。あなたのpluginが新しい
アーキテクチャ以前に作られたものであれば、このガイドが移行を助けます。

## 何が変わるのか

古いplugin systemは、pluginが必要なものを
単一のentry pointから何でもimportできる、2つの広く開かれたsurfaceを提供していました。

- **`openclaw/plugin-sdk/compat`** — 数十の
  helperを再エクスポートする単一import。新しい
  pluginアーキテクチャを構築している間、古いhookベースpluginを動かし続けるために導入されました。
- **`openclaw/extension-api`** — pluginに、埋め込みagent runnerのような
  host側helperへの直接アクセスを与えるbridge。

これら2つのsurfaceは現在どちらも**非推奨**です。実行時にはまだ動作しますが、新しい
pluginはこれらを使ってはいけません。また既存pluginも、次の
major releaseで削除される前に移行すべきです。

<Warning>
  後方互換レイヤーは将来のmajor releaseで削除されます。
  これらのsurfaceからimportしているpluginは、その時点で壊れます。
</Warning>

## なぜ変わったのか

古いアプローチには問題がありました。

- **起動が遅い** — 1つのhelperをimportするだけで無関係なmoduleが数十個読み込まれていました
- **循環依存** — 広範な再エクスポートにより、import cycleを簡単に作れてしまいました
- **不明瞭なAPI surface** — どのexportがstableで、どれがinternalなのかを判別する手段がありませんでした

モダンなplugin SDKはこれを解決します。各import path（`openclaw/plugin-sdk/\<subpath\>`）
は、小さく自己完結したmoduleであり、明確な目的と文書化されたcontractを持ちます。

bundled channel向けのlegacy provider convenience seamも削除されました。
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
channel名付きhelper seam、および
`openclaw/plugin-sdk/telegram-core` のようなimportは、
stableなplugin contractではなくprivateなmono-repo shortcutでした。代わりに
汎用の細いSDK subpathを使ってください。bundled plugin workspace内では、
provider所有helperはそのplugin自身の
`api.ts` または `runtime-api.ts` に保持してください。

現在のbundled provider例:

- AnthropicはClaude固有のstream helperを自分自身の `api.ts` /
  `contract-api.ts` seamに保持しています
- OpenAIはprovider builder、default-model helper、realtime provider
  builderを自分自身の `api.ts` に保持しています
- OpenRouterはprovider builderとonboarding/config helperを自分自身の
  `api.ts` に保持しています

## 移行方法

<Steps>
  <Step title="Windows wrapper fallback動作を監査する">
    あなたのpluginが `openclaw/plugin-sdk/windows-spawn` を使っている場合、解決できないWindows
    `.cmd`/`.bat` wrapperは、明示的に
    `allowShellFallback: true` を渡さない限りfail-closedするようになりました。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // shell経由fallbackを意図的に受け入れる、信頼済みの互換性callerにのみ設定します。
      allowShellFallback: true,
    });
    ```

    callerが意図的にshell fallbackへ依存していない場合は、
    `allowShellFallback` を設定せず、代わりにthrowされたerrorを処理してください。

  </Step>

  <Step title="非推奨importを見つける">
    あなたのplugin内で、どちらかの非推奨surfaceからのimportを検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="目的別importへ置き換える">
    古いsurfaceの各exportは、特定のモダンimport pathへ対応しています。

    ```typescript
    // Before（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After（モダンな目的別import）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host側helperについては、直接importする代わりに
    注入されたplugin runtimeを使ってください。

    ```typescript
    // Before（非推奨extension-api bridge）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After（注入されたruntime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他のlegacy bridge helperにも適用されます。

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

  <Step title="buildしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import pathリファレンス

<Accordion title="よく使うimport path一覧">
  | Import path | 用途 | 主なexport |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正式なplugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | channel entry definition/builder向けlegacy umbrella再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルートconfig schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一provider entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 目的別channel entry definitionとbuilder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有setup wizard helper | Allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup時runtime helper | import-safeなsetup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | multi-account helper | account list/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 細いaccount helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing primitive | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix + typing配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | channel config schema型 |
  | `plugin-sdk/telegram-command-config` | Telegram command config helper | command名正規化、description切り詰め、重複/競合検証 |
  | `plugin-sdk/channel-policy` | group/DM policy解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status追跡 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | inbound envelope helper | 共通route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply helper | 共通record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | messaging target解析 | target解析/一致helper |
  | `plugin-sdk/outbound-media` | outbound media helper | 共通outbound media読み込み |
  | `plugin-sdk/outbound-runtime` | outbound runtime helper | outbound identity/send delegate helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycleとadapter helper |
  | `plugin-sdk/agent-media-payload` | legacy media payload helper | legacy field layout向けagent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換shim | legacy channel runtime utilityのみ |
  | `plugin-sdk/channel-send-result` | send result型 | reply result型 |
  | `plugin-sdk/runtime-store` | 永続plugin storage | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なruntime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 細いruntime env helper | logger/runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有plugin runtime helper | plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共通webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共通exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway clientとchannel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram command helper | bundled Telegram contract surfaceが利用できないときのfallback-stableなTelegram command検証helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec/plugin approval payload、approval capability/profile helper、native approval routing/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | native exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | native approval capability/delivery adapter |
  | `plugin-sdk/approval-native-runtime` | approval target helper | native approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec/plugin approval reply payload helper |
  | `plugin-sdk/security-runtime` | security helper | 共通trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlistとprivate-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | bounded cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | wrapped fetch/proxy helper | `resolveFetch`、proxy helper |
  | `plugin-sdk/host-runtime` | host正規化helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist inputマッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gatingとcommand-surface helper | `resolveControlCommandGate`, sender認可helper, command registry helper |
  | `plugin-sdk/secret-input` | secret input解析 | secret input helper |
  | `plugin-sdk/webhook-ingress` | webhook request helper | webhook target utility |
  | `plugin-sdk/webhook-request-guards` | webhook body guard helper | request body read/limit helper |
  | `plugin-sdk/reply-runtime` | 共有reply runtime | inbound dispatch、heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 細いreply dispatch helper | finalize + provider dispatch helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | stateとOAuth dir helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key正規化helper |
  | `plugin-sdk/status-helpers` | channel status helper | channel/account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | string正規化helper | slug/string正規化helper |
  | `plugin-sdk/request-url` | request URL helper | request風inputからstring URLを抽出 |
  | `plugin-sdk/run-command` | timed command helper | stdout/stderrを正規化したtimed command runner |
  | `plugin-sdk/param-readers` | param reader | 一般的なtool/CLI param reader |
  | `plugin-sdk/tool-send` | tool send抽出 | tool argsから正規send target fieldを抽出 |
  | `plugin-sdk/temp-path` | temp path helper | 共通temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem loggerとredaction helper |
  | `plugin-sdk/markdown-table-runtime` | markdown-table helper | markdown table mode helper |
  | `plugin-sdk/reply-payload` | message reply型 | reply payload型 |
  | `plugin-sdk/provider-setup` | 厳選されたlocal/self-hosted provider setup helper | self-hosted provider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 目的別OpenAI互換self-hosted provider setup helper | 同じself-hosted provider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key解決helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 共通interactive login helper |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay-policy builder、provider-endpoint helper、model-id正規化helper |
  | `plugin-sdk/provider-catalog-shared` | 共有provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider onboarding patch | onboarding config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | 汎用provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration/cache helper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration/cache/config helper |
  | `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、さらに `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などのxAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他provider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper型、共有Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/keyed-async-queue` | 順序付きasync queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有media helper | media fetch/transform/store helperとmedia payload builder |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider型とprovider向けimage/audio helper export |
  | `plugin-sdk/text-runtime` | 共有text helper | assistant可視text stripping、markdown render/chunking/table helper、redaction helper、directive-tag helper、safe-text utility、その他のtext/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | outbound text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider型とprovider向けdirective、registry、validation helper |
  | `plugin-sdk/speech-core` | 共有speech core | speech provider型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider型とregistry helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider型とregistry helper |
  | `plugin-sdk/image-generation-core` | 共有image-generation core | image-generation型、failover、auth、registry helper |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result型 |
  | `plugin-sdk/video-generation-core` | 共有video-generation core | video-generation型、failover helper、provider lookup、model-ref parsing |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | channel config primitive | 細いchannel config-schema primitive |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write認可helper |
  | `plugin-sdk/channel-plugin-common` | 共有channel prelude | 共有channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共有channel status snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit/read helper |
  | `plugin-sdk/group-access` | group access helper | 共有group-access decision helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共有direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 共有extension helper | passive-channel/status helper primitive |
  | `plugin-sdk/webhook-targets` | webhook target helper | webhook target registryとroute-install helper |
  | `plugin-sdk/webhook-path` | webhook path helper | webhook path正規化helper |
  | `plugin-sdk/web-media` | 共有web media helper | remote/local media loading helper |
  | `plugin-sdk/zod` | Zod再エクスポート | plugin SDK consumer向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | bundled memory-core helper | memory manager/config/file/CLI helper surface |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory host embedding engine export |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | memory host QMD engine export |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | memory host storage engine export |
  | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal helper | memory host multimodal helper |
  | `plugin-sdk/memory-core-host-query` | memory host query helper | memory host query helper |
  | `plugin-sdk/memory-core-host-secret` | memory host secret helper | memory host secret helper |
  | `plugin-sdk/memory-core-host-status` | memory host status helper | memory host status helper |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | memory host CLI runtime helper |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | memory host core runtime helper |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host file/runtime helper | memory host file/runtime helper |
  | `plugin-sdk/memory-lancedb` | bundled memory-lancedb helper | memory-lancedb helper surface |
  | `plugin-sdk/testing` | test utility | test helperとmock |
</Accordion>

この一覧は意図的に、完全なSDK
surfaceではなく、よく使う移行対象のサブセットです。200以上のentrypointからなる完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には依然として、一部のbundled-plugin helper seamも含まれています。たとえば
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` などです。これらはbundled-pluginの保守と互換性のために
引き続きexportされていますが、一般的な移行一覧からは意図的に
除外されており、新しいplugin codeの推奨ターゲットではありません。

同じルールは、他のbundled-helper familyにも適用されます。たとえば:

- browser support helper: `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/plugin surface: `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` は現在、細いtoken-helper
surfaceとして `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を公開しています。

作業に合った最も細いimportを使ってください。exportが見つからない場合は、
`src/plugin-sdk/` のsourceを確認するか、Discordで質問してください。

## 削除スケジュール

| When                   | 何が起こるか                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| **Now**                | 非推奨surfaceが実行時warningを出します                           |
| **Next major release** | 非推奨surfaceが削除され、それを使い続けるpluginは失敗します |

すべてのcore pluginはすでに移行済みです。外部pluginは
次のmajor releaseまでに移行すべきです。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的なescape hatchであり、恒久的な解決策ではありません。

## 関連

- [はじめに](/plugins/building-plugins) — 最初のpluginを作る
- [SDK Overview](/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Channel Plugins](/plugins/sdk-channel-plugins) — channel pluginの作成
- [Provider Plugins](/plugins/sdk-provider-plugins) — provider pluginの作成
- [Plugin Internals](/plugins/architecture) — アーキテクチャの詳細
- [Plugin Manifest](/plugins/manifest) — manifest schemaリファレンス
