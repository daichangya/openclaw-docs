---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED警告が表示されたとき
    - OPENCLAW_EXTENSION_API_DEPRECATED警告が表示されたとき
    - pluginをモダンなplugin architectureに更新しているとき
    - 外部のOpenClaw pluginを保守しているとき
sidebarTitle: Migrate to SDK
summary: 従来の後方互換レイヤーからモダンなPlugin SDKへ移行する
title: Plugin SDKの移行
x-i18n:
    generated_at: "2026-04-09T01:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60cbb6c8be30d17770887d490c14e3a4538563339a5206fb419e51e0558bbc07
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDKの移行

OpenClawは、広範な後方互換レイヤーから、用途を絞った文書化済みimportを備えたモダンなplugin
architectureへ移行しました。あなたのpluginがこの新しい
architecture以前に作られたものであれば、このガイドが移行に役立ちます。

## 何が変わるのか

古いplugin systemは、単一のentry pointから必要なものを何でも
importできる、2つの広範なsurfaceを提供していました。

- **`openclaw/plugin-sdk/compat`** — 数十個の
  helperを再エクスポートする単一import。新しいplugin architectureの構築中に、
  旧来のhookベースpluginを動かし続けるために導入されました。
- **`openclaw/extension-api`** — 組み込みagent runnerのような
  host側helperへの直接アクセスをpluginに与えるbridge。

これら2つのsurfaceは現在**非推奨**です。ランタイムではまだ動作しますが、新しい
pluginでは使ってはいけません。既存pluginも、次のmajor releaseで削除される前に
移行する必要があります。

<Warning>
  この後方互換レイヤーは、将来のmajor releaseで削除されます。
  これらのsurfaceからまだimportしているpluginは、その時点で動作しなくなります。
</Warning>

## なぜ変わったのか

古いアプローチはいくつかの問題を引き起こしていました。

- **起動が遅い** — 1つのhelperをimportするだけで、無関係なmoduleが数十個読み込まれていた
- **循環依存** — 広範な再エクスポートにより、import cycleが簡単に生まれていた
- **API surfaceが不明確** — どのexportが安定していて、どれが内部用なのか判別できなかった

モダンなPlugin SDKはこれを改善します。各import path（`openclaw/plugin-sdk/\<subpath\>`）
は、目的が明確で契約が文書化された、小さく自己完結したmoduleです。

bundled channel向けの従来のprovider convenience seamも廃止されました。  
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
channelブランドのhelper seam、および
`openclaw/plugin-sdk/telegram-core` のようなimportは、安定したplugin contractではなく、
private mono-repo shortcutでした。代わりに、汎用の細いSDK subpathを使用してください。bundled
plugin workspace内では、provider所有のhelperはそのplugin自身の
`api.ts` または `runtime-api.ts` に置いてください。

現在のbundled providerの例:

- AnthropicはClaude固有のstream helperを自身の `api.ts` /
  `contract-api.ts` seamに保持しています
- OpenAIはprovider builder、default-model helper、realtime provider
  builderを自身の `api.ts` に保持しています
- OpenRouterはprovider builderとonboarding/config helperを自身の
  `api.ts` に保持しています

## 移行方法

<Steps>
  <Step title="approval-native handlerをcapability factへ移行する">
    approval対応channel pluginは、現在ではnative approval動作を
    `approvalCapability.nativeRuntime` と共有runtime-context registry経由で公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - approval固有のauth/deliveryを従来の `plugin.auth` /
      `plugin.approvals` 配線から外し、`approvalCapability` に移す
    - `ChannelPlugin.approvals` はpublicなchannel-plugin
      contractから削除されました。delivery/native/render fieldは `approvalCapability` に移してください
    - `plugin.auth` はchannel login/logoutフロー専用として残ります。そこにあるapproval auth
      hookは、coreではもう読み取られません
    - client、token、Bolt
      appなどのchannel所有runtime objectは、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - native approval handlerからplugin所有のreroute noticeを送信しないこと。
      実際のdelivery resultに基づく「別経路へルーティングされた」通知は現在coreが担います
    - `channelRuntime` を `createChannelManager(...)` に渡す際は、
      実際の `createPluginRuntime().channel` surfaceを渡してください。部分的stubは拒否されます

    現在のapproval capability
    layoutについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper fallback動作を監査する">
    pluginが `openclaw/plugin-sdk/windows-spawn` を使用している場合、
    解決できないWindows `.cmd`/`.bat` wrapperは、明示的に
    `allowShellFallback: true` を渡さない限り、現在はfail closedします。

    ```typescript
    // 変更前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 変更後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // shell経由fallbackを意図的に受け入れる、信頼済み互換callerに対してのみ
      // これを設定してください。
      allowShellFallback: true,
    });
    ```

    callerが意図的にshell fallbackへ依存していないなら、`allowShellFallback`
    は設定せず、代わりにthrowされたerrorを処理してください。

  </Step>

  <Step title="非推奨importを見つける">
    plugin内で、いずれかの非推奨surfaceからimportしている箇所を検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="用途を絞ったimportに置き換える">
    古いsurfaceの各exportは、対応するモダンなimport pathにマッピングされています。

    ```typescript
    // 変更前（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 変更後（用途を絞ったモダンなimport）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host側helperについては、直接importするのではなく、注入されたplugin runtimeを使用します。

    ```typescript
    // 変更前（非推奨のextension-api bridge）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 変更後（注入されたruntime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは他の従来bridge helperにも当てはまります。

    | 旧import | モダンな対応先 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helper | `api.runtime.agent.session.*` |

  </Step>

  <Step title="buildしてtestする">
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
  | `plugin-sdk/core` | channel entry定義/ builder向け従来umbrella再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルートconfig schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一provider用entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 用途を絞ったchannel entry定義とbuilder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有setup wizard helper | Allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup時runtime helper | import-safeなsetup patch adapter、lookup-note helper、`promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数account helper | account一覧/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`, account-id正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 細いaccount helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing primitive | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix + typing配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | channel config schema型 |
  | `plugin-sdk/telegram-command-config` | Telegram command config helper | command名正規化、description切り詰め、重複/競合検証 |
  | `plugin-sdk/channel-policy` | group/DM policy解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status追跡 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | inbound envelope helper | 共有route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply helper | 共有record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | messaging target解析 | target解析/照合helper |
  | `plugin-sdk/outbound-media` | outbound media helper | 共有outbound media読み込み |
  | `plugin-sdk/outbound-runtime` | outbound runtime helper | outbound identity/send delegate helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycleおよびadapter helper |
  | `plugin-sdk/agent-media-payload` | 従来media payload helper | 従来field layout用agent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換shim | 従来channel runtime utilityのみ |
  | `plugin-sdk/channel-send-result` | send result型 | reply result型 |
  | `plugin-sdk/runtime-store` | 永続plugin storage | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なruntime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 細いruntime env helper | logger/runtime env、timeout、retry、およびbackoff helper |
  | `plugin-sdk/plugin-runtime` | 共有plugin runtime helper | plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共有webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共有exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway clientおよびchannel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram command helper | bundled Telegram contract surfaceが利用できない場合のfallback安定Telegram command検証helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec/plugin approval payload、approval capability/profile helper、native approval routing/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | native exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | native approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval Gateway helper | 共有approval gateway解決helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helper | hot channel entrypoint向け軽量native approval adapter読み込みhelper |
  | `plugin-sdk/approval-handler-runtime` | approval handler helper | より広範なapproval handler runtime helper。より細いadapter/gateway seamで足りるならそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | approval target helper | native approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec/plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | channel runtime-context helper | 汎用channel runtime-context register/get/watch helper |
  | `plugin-sdk/security-runtime` | security helper | 共有trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlistおよびprivate-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | bounded cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | wrapped fetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host正規化helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gatingとcommand-surface helper | `resolveControlCommandGate`, sender-authorization helper、command registry helper |
  | `plugin-sdk/command-status` | command status/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret入力解析 | secret入力helper |
  | `plugin-sdk/webhook-ingress` | webhook request helper | webhook target utility |
  | `plugin-sdk/webhook-request-guards` | webhook body guard helper | request body read/limit helper |
  | `plugin-sdk/reply-runtime` | 共有reply runtime | inbound dispatch、heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 細いreply dispatch helper | finalize + provider dispatch helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | stateおよびOAuth dir helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key正規化helper |
  | `plugin-sdk/status-helpers` | channel status helper | channel/account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化helper | slug/文字列正規化helper |
  | `plugin-sdk/request-url` | request URL helper | request風入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時限付きcommand helper | stdout/stderrを正規化した時限付きcommand runner |
  | `plugin-sdk/param-readers` | param reader | 共通tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload抽出 | tool result objectから正規化済みpayloadを抽出 |
  | `plugin-sdk/tool-send` | tool send抽出 | tool argsから標準send target fieldを抽出 |
  | `plugin-sdk/temp-path` | 一時path helper | 共有temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem loggerおよびredaction helper |
  | `plugin-sdk/markdown-table-runtime` | markdown-table helper | markdown table mode helper |
  | `plugin-sdk/reply-payload` | message reply型 | reply payload型 |
  | `plugin-sdk/provider-setup` | 厳選されたlocal/self-hosted provider setup helper | self-hosted provider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 用途を絞ったOpenAI互換self-hosted provider setup helper | 同じself-hosted provider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key解決helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 共有interactive login helper |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay-policy builder、provider-endpoint helper、およびmodel-id正規化helper |
  | `plugin-sdk/provider-catalog-shared` | 共有provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider onboarding patch | onboarding config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | 汎用provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration/cache helper |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search config helper | plugin-enable配線を必要としないprovider向けの細いweb-search config/credential helper |
  | `plugin-sdk/provider-web-search-contract` | provider web-search contract helper | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, scoped credential setter/getterなどの細いweb-search config/credential contract helper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration/cache/runtime helper |
  | `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などのxAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, その他のprovider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper型、および共有Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/keyed-async-queue` | 順序付きasync queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有media helper | media fetch/transform/store helperとmedia payload builder |
  | `plugin-sdk/media-generation-runtime` | 共有media-generation helper | image/video/music generation向けの共有failover helper、candidate選択、およびmissing-model message |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider型とprovider向けimage/audio helper export |
  | `plugin-sdk/text-runtime` | 共有text helper | assistant可視textの除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全なtext utility、および関連text/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | outbound text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider型とprovider向けdirective、registry、validation helper |
  | `plugin-sdk/speech-core` | 共有speech core | speech provider型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider型とregistry helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider型とregistry helper |
  | `plugin-sdk/image-generation-core` | 共有image-generation core | image-generation型、failover、auth、およびregistry helper |
  | `plugin-sdk/music-generation` | music-generation helper | music-generation provider/request/result型 |
  | `plugin-sdk/music-generation-core` | 共有music-generation core | music-generation型、failover helper、provider lookup、およびmodel-ref解析 |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result型 |
  | `plugin-sdk/video-generation-core` | 共有video-generation core | video-generation型、failover helper、provider lookup、およびmodel-ref解析 |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | channel config primitive | 細いchannel config-schema primitive |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write authorization helper |
  | `plugin-sdk/channel-plugin-common` | 共有channel prelude | 共有channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共有channel status snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit/read helper |
  | `plugin-sdk/group-access` | group access helper | 共有group-access decision helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共有direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 共有extension helper | passive-channel/statusおよびambient proxy helper primitive |
  | `plugin-sdk/webhook-targets` | webhook target helper | webhook target registryおよびroute-install helper |
  | `plugin-sdk/webhook-path` | webhook path helper | webhook path正規化helper |
  | `plugin-sdk/web-media` | 共有web media helper | remote/local media読み込みhelper |
  | `plugin-sdk/zod` | Zod再エクスポート | plugin SDK利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | bundled memory-core helper | memory manager/config/file/CLI helper surface |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory host embedding engine export |
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
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory隣接plugin向けの共有managed-markdown helper |
  | `plugin-sdk/memory-host-search` | active memory search facade | lazy active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helperのvendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | bundled memory-lancedb helper | memory-lancedb helper surface |
  | `plugin-sdk/testing` | test utility | test helperおよびmock |
</Accordion>

この表は、完全なSDK
surfaceではなく、意図的に一般的な移行向けの一部だけを示しています。200以上のentrypointからなる完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のようなbundled-plugin helper seamも依然として含まれています。  
これらはbundled-pluginの保守と互換性のために引き続きexportされていますが、
一般的な移行表からは意図的に除外されており、新しいplugin codeの
推奨先ではありません。

同じルールは、他のbundled-helper系にも当てはまります。たとえば:

- browser support helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` のような
  bundled helper/plugin surface

`plugin-sdk/github-copilot-token` は現在、細いtoken-helper
surfaceとして `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を公開しています。

作業に合った最も細いimportを使ってください。必要なexportが見つからない場合は、
`src/plugin-sdk/` のsourceを確認するか、Discordで質問してください。

## 削除タイムライン

| 時期 | 起きること |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在** | 非推奨surfaceがランタイム警告を出す |
| **次のmajor release** | 非推奨surfaceが削除される。まだ使用しているpluginは失敗する |

すべてのcore pluginはすでに移行済みです。外部pluginは、
次のmajor releaseの前に移行してください。

## 一時的に警告を抑制する

移行作業中は、これらの環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的なescape hatchであり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初のpluginを作る
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — channel pluginの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider pluginの構築
- [Plugin Internals](/ja-JP/plugins/architecture) — architectureの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schemaリファレンス
