---
read_when:
    - どのSDK subpathからimportすべきか知る必要があるとき
    - OpenClawPluginApi上のすべてのregistration methodのリファレンスが欲しいとき
    - 特定のSDK exportを調べているとき
sidebarTitle: SDK Overview
summary: import map、registration APIリファレンス、SDKアーキテクチャ
title: Plugin SDK Overview
x-i18n:
    generated_at: "2026-04-05T12:53:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK Overview

plugin SDKは、pluginとcoreの間の型付き契約です。このページは、
**何をimportするか** と **何を登録できるか** のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初のpluginですか？ [はじめに](/plugins/building-plugins) から始めてください
  - Channel pluginですか？ [Channel Plugins](/plugins/sdk-channel-plugins) を参照してください
  - Provider pluginですか？ [Provider Plugins](/plugins/sdk-provider-plugins) を参照してください
</Tip>

## Import規約

必ず特定のsubpathからimportしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各subpathは、小さく自己完結したmoduleです。これにより起動を高速に保ち、
循環依存の問題を防ぎます。channel固有のentry/build helperには、
`openclaw/plugin-sdk/channel-core` を優先し、より広いumbrella surfaceと
`buildChannelConfigSchema` のような共有helperには `openclaw/plugin-sdk/core` を使ってください。

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` のような
provider名付きのconvenience seamや、
channelブランドのhelper seamを追加したり依存したりしてはいけません。bundled pluginは、
自分自身の `api.ts` または `runtime-api.ts` barrelの中で汎用
SDK subpathを組み合わせるべきであり、coreは
そうしたpluginローカルbarrelを使うか、真にcross-channelな必要がある場合にのみ
狭い汎用SDK契約を追加するべきです。

生成されたexport mapには、依然として少数のbundled-plugin helper
seam、たとえば `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` などが含まれています。これらの
subpathはbundled-pluginの保守と互換性のためだけに存在しており、
下の一般テーブルからは意図的に除外されていて、新しいthird-party plugin向けの
推奨import pathではありません。

## Subpathリファレンス

最も一般的に使われるsubpathを、用途別に分類しています。完全な
200以上のsubpath一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約済みのbundled-plugin helper subpathも、その生成済み一覧には引き続き現れます。
docページで明示的にpublicとして推奨されていない限り、それらは実装詳細/互換性surfaceとして扱ってください。

### Plugin entry

| Subpath                     | 主なexports                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                  |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                     |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod schema export（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有setup wizard helper、allowlist prompt、setup status builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウントconfig/action-gate helper、default-account fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id正規化helper |
    | `plugin-sdk/account-resolution` | Account lookup + default-fallback helper |
    | `plugin-sdk/account-helpers` | 狭いaccount-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel config schema型 |
    | `plugin-sdk/telegram-command-config` | bundled-contract fallback付きのTelegram custom-command正規化/検証helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共有inbound route + envelope builder helper |
    | `plugin-sdk/inbound-reply-dispatch` | 共有inbound記録・dispatch helper |
    | `plugin-sdk/messaging-targets` | Target parsing/matching helper |
    | `plugin-sdk/outbound-media` | 共有outbound media loading helper |
    | `plugin-sdk/outbound-runtime` | Outbound identity/send delegate helper |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycleおよびadapter helper |
    | `plugin-sdk/agent-media-payload` | レガシーagent media payload builder |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding、pairing、configured-binding helper |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot helper |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy解決helper |
    | `plugin-sdk/channel-status` | 共有channel status snapshot/summary helper |
    | `plugin-sdk/channel-config-primitives` | 狭いchannel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | Channel config-write authorization helper |
    | `plugin-sdk/channel-plugin-common` | 共有channel plugin prelude exports |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read helper |
    | `plugin-sdk/group-access` | 共有group-access decision helper |
    | `plugin-sdk/direct-dm` | 共有direct-DM auth/guard helper |
    | `plugin-sdk/interactive-runtime` | Interactive reply payload正規化/縮約helper |
    | `plugin-sdk/channel-inbound` | Debounce、mention matching、envelope helper |
    | `plugin-sdk/channel-send-result` | Reply result型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Target parsing/matching helper |
    | `plugin-sdk/channel-contract` | Channel contract型 |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたlocal/self-hosted provider setup helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換self-hosted provider setupに特化したhelper |
    | `plugin-sdk/cli-backend` | CLI backend default + watchdog定数 |
    | `plugin-sdk/provider-auth-runtime` | provider plugin向けruntime API-key解決helper |
    | `plugin-sdk/provider-auth-api-key` | API-key onboarding/profile-write helper |
    | `plugin-sdk/provider-auth-result` | 標準OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | provider plugin向け共有interactive login helper |
    | `plugin-sdk/provider-env-vars` | Provider auth env-var lookup helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay-policy builder、provider-endpoint helper、および `normalizeNativeXaiModelId` のようなmodel-id正規化helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用provider HTTP/endpoint capability helper |
    | `plugin-sdk/provider-web-fetch` | Web-fetch provider registration/cache helper |
    | `plugin-sdk/provider-web-search` | Web-search provider registration/cache/config helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のようなxAI compat helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper型、および共有Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-onboard` | Onboarding config patch helper |
    | `plugin-sdk/global-singleton` | Process-local singleton/map/cache helper |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry helper, sender-authorization helper |
    | `plugin-sdk/approval-auth-runtime` | Approver解決およびsame-chat action-auth helper |
    | `plugin-sdk/approval-client-runtime` | Native exec approval profile/filter helper |
    | `plugin-sdk/approval-delivery-runtime` | Native approval capability/delivery adapter |
    | `plugin-sdk/approval-native-runtime` | Native approval target + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin approval reply payload helper |
    | `plugin-sdk/command-auth-native` | Native command auth + native session-target helper |
    | `plugin-sdk/command-detection` | 共有command detection helper |
    | `plugin-sdk/command-surface` | Command-body正規化およびcommand-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | 共有trust、DM gating、external-content、secret-collection helper |
    | `plugin-sdk/ssrf-policy` | Host allowlistおよびprivate-network SSRF policy helper |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF-guarded fetch、およびSSRF policy helper |
    | `plugin-sdk/secret-input` | Secret input parsing helper |
    | `plugin-sdk/webhook-ingress` | Webhook request/target helper |
    | `plugin-sdk/webhook-request-guards` | Request body size/timeout helper |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なruntime/logging/backup/plugin-install helper |
    | `plugin-sdk/runtime-env` | 狭いruntime env、logger、timeout、retry、backoff helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有plugin command/hook/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 共有webhook/internal hook pipeline helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` などのlazy runtime import/binding helper |
    | `plugin-sdk/process-runtime` | Process exec helper |
    | `plugin-sdk/cli-runtime` | CLI formatting、wait、version helper |
    | `plugin-sdk/gateway-runtime` | Gateway clientおよびchannel-status patch helper |
    | `plugin-sdk/config-runtime` | Config load/write helper |
    | `plugin-sdk/telegram-command-config` | bundled Telegram contract surfaceが利用できない場合でも、Telegram command-name/description正規化とduplicate/conflict check |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval helper、approval-capability builder、auth/profile helper、native routing/runtime helper |
    | `plugin-sdk/reply-runtime` | 共有inbound/reply runtime helper、chunking、dispatch、heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭いreply dispatch/finalize helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの共有short-window reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いtext/markdown chunking helper |
    | `plugin-sdk/session-store-runtime` | Session store path + updated-at helper |
    | `plugin-sdk/state-paths` | State/OAuth dir path helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` などのroute/session-key/account binding helper |
    | `plugin-sdk/status-helpers` | 共有channel/account status summary helper、runtime-state default、issue metadata helper |
    | `plugin-sdk/target-resolver-runtime` | 共有target resolver helper |
    | `plugin-sdk/string-normalization-runtime` | Slug/string正規化helper |
    | `plugin-sdk/request-url` | fetch/request類似入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化されたstdout/stderr結果を返すタイムアウト付きcommand runner |
    | `plugin-sdk/param-readers` | 共通tool/CLI param reader |
    | `plugin-sdk/tool-send` | tool argsから正規send target fieldを抽出 |
    | `plugin-sdk/temp-path` | 共有temp-download path helper |
    | `plugin-sdk/logging-core` | Subsystem loggerおよび秘匿化helper |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode helper |
    | `plugin-sdk/json-store` | 小さなJSON state read/write helper |
    | `plugin-sdk/file-lock` | 再入可能file-lock helper |
    | `plugin-sdk/persistent-dedupe` | Disk-backed dedupe cache helper |
    | `plugin-sdk/acp-runtime` | ACP runtime/session helper |
    | `plugin-sdk/agent-config-primitives` | 狭いagent runtime config-schema primitive |
    | `plugin-sdk/boolean-param` | 緩いboolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name matching解決helper |
    | `plugin-sdk/device-bootstrap` | Device bootstrapおよびpairing token helper |
    | `plugin-sdk/extension-shared` | 共有passive-channelおよびstatus helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing helper |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize helper |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint detection helper |
    | `plugin-sdk/infra-runtime` | System event/heartbeat helper |
    | `plugin-sdk/collection-runtime` | 小さな境界付きcache helper |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flagおよびevent helper |
    | `plugin-sdk/error-runtime` | Error graph、formatting、共有error classification helper、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch、proxy、およびpinned lookup helper |
    | `plugin-sdk/host-runtime` | HostnameおよびSCP host正規化helper |
    | `plugin-sdk/retry-runtime` | Retry configおよびretry runner helper |
    | `plugin-sdk/agent-runtime` | Agent dir/identity/workspace helper |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有media fetch/transform/store helperとmedia payload builder |
    | `plugin-sdk/media-understanding` | Media understanding provider型とprovider向けimage/audio helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text stripping、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全なtext utilityなどの共有text/markdown/logging helper |
    | `plugin-sdk/text-chunking` | Outbound text chunking helper |
    | `plugin-sdk/speech` | Speech provider型とprovider向けdirective、registry、validation helper |
    | `plugin-sdk/speech-core` | 共有speech provider型、registry、directive、normalization helper |
    | `plugin-sdk/realtime-transcription` | Realtime transcription provider型とregistry helper |
    | `plugin-sdk/realtime-voice` | Realtime voice provider型とregistry helper |
    | `plugin-sdk/image-generation` | Image generation provider型 |
    | `plugin-sdk/image-generation-core` | 共有image-generation型、failover、auth、registry helper |
    | `plugin-sdk/video-generation` | Video generation provider/request/result型 |
    | `plugin-sdk/video-generation-core` | 共有video-generation型、failover helper、provider lookup、およびmodel-ref parsing |
    | `plugin-sdk/webhook-targets` | Webhook target registryおよびroute-install helper |
    | `plugin-sdk/webhook-path` | Webhook path正規化helper |
    | `plugin-sdk/web-media` | 共有remote/local media loading helper |
    | `plugin-sdk/zod` | plugin SDK利用者向けに再exportされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory subpaths">
    | Subpath | 主なexports |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helper向けbundled memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine exports |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding engine exports |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine exports |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine exports |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal helper |
    | `plugin-sdk/memory-core-host-query` | Memory host query helper |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret helper |
    | `plugin-sdk/memory-core-host-status` | Memory host status helper |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI runtime helper |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host core runtime helper |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host file/runtime helper |
    | `plugin-sdk/memory-lancedb` | bundled memory-lancedb helper surface |
  </Accordion>

  <Accordion title="予約済みbundled-helper subpaths">
    | Family | 現在のsubpaths | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | bundled browser plugin support helper |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | bundled Matrix helper/runtime surface |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | bundled LINE helper/runtime surface |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | bundled IRC helper surface |
    | Channel固有helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | bundled channel compatibility/helper seam |
    | Auth/plugin固有helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | bundled feature/plugin helper seam。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をexportします |
  </Accordion>
</AccordionGroup>

## Registration API

`register(api)` callbackは、次の
methodを持つ `OpenClawPluginApi` objectを受け取ります。

### Capability registration

| Method                                           | 登録するもの                    |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Text inference（LLM）           |
| `api.registerCliBackend(...)`                    | Local CLI inference backend     |
| `api.registerChannel(...)`                       | Messaging channel               |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis  |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcription |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime voice session   |
| `api.registerMediaUnderstandingProvider(...)`    | Image/audio/video analysis      |
| `api.registerImageGenerationProvider(...)`       | Image generation                |
| `api.registerVideoGenerationProvider(...)`       | Video generation                |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider     |
| `api.registerWebSearchProvider(...)`             | Web search                      |

### Toolsとcommands

| Method                          | 登録するもの                                   |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent tool（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | Custom command（LLMを経由しない）              |

### Infrastructure

| Method                                         | 登録するもの           |
| ---------------------------------------------- | ---------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook             |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint  |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method     |
| `api.registerCli(registrar, opts?)`            | CLI subcommand         |
| `api.registerService(service)`                 | Background service     |
| `api.registerInteractiveHandler(registration)` | Interactive handler    |

予約済みのcore admin namespace（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は、pluginがより狭いgateway method scopeを
割り当てようとしても、常に `operator.admin` のままです。plugin所有methodには、
plugin固有のprefixを優先してください。

### CLI registration metadata

`api.registerCli(registrar, opts?)` は、2種類のトップレベルmetadataを受け付けます。

- `commands`: registrarが所有する明示的なcommand root
- `descriptors`: ルートCLI help、
  routing、およびlazy plugin CLI registrationに使われるparse時command descriptor

plugin commandを通常のroot CLI pathでlazy-loadedのままにしたいなら、
そのregistrarが公開するすべてのトップレベルcommand rootをカバーする
`descriptors` を提供してください。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

lazy root CLI registrationが不要な場合にのみ、`commands` 単独を使ってください。
このeager互換経路は引き続きサポートされますが、parse時lazy loading用の
descriptor-backed placeholderはインストールしません。

### CLI backend registration

`api.registerCliBackend(...)` により、pluginが `claude-cli` や `codex-cli` のようなlocal
AI CLI backendのdefault configを所有できます。

- backendの `id` は、`claude-cli/opus` のようなmodel refにおけるprovider prefixになります。
- backendの `config` は `agents.defaults.cliBackends.<id>` と同じ形状を使います。
- user configが優先されます。OpenClawはCLI実行前に
  plugin defaultの上へ `agents.defaults.cliBackends.<id>` をマージします。
- backendがマージ後に互換性のための書き換えを必要とする場合（たとえば
  古いflag shapeの正規化）には、`normalizeConfig` を使ってください。

### Exclusive slots

| Method                                     | 登録するもの                         |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context engine（一度に1つだけアクティブ） |
| `api.registerMemoryPromptSection(builder)` | Memory prompt section builder        |
| `api.registerMemoryFlushPlan(resolver)`    | Memory flush plan resolver           |
| `api.registerMemoryRuntime(runtime)`       | Memory runtime adapter               |

### Memory embedding adapters

| Method                                         | 登録するもの                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブplugin用のmemory embedding adapter      |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, および
  `registerMemoryRuntime` はmemory plugin専用です。
- `registerMemoryEmbeddingProvider` により、アクティブなmemory pluginは
  1つ以上のembedding adapter id（例: `openai`, `gemini`, またはcustom
  plugin定義id）を登録できます。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` のようなuser configは、
  それら登録済みadapter idに対して解決されます。

### Eventsとlifecycle

| Method                                       | 動作内容                     |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きlifecycle hook         |
| `api.onConversationBindingResolved(handler)` | Conversation binding callback |

### Hook decision semantics

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのhandlerがこれを設定した時点で、より低優先度のhandlerはスキップされます。
- `before_tool_call`: `{ block: false }` を返すことは、上書きではなく no decision（`block` を省略したのと同じ）として扱われます。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのhandlerがこれを設定した時点で、より低優先度のhandlerはスキップされます。
- `before_install`: `{ block: false }` を返すことは、上書きではなく no decision（`block` を省略したのと同じ）として扱われます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのhandlerがこれを設定した時点で、より低優先度のhandlerはスキップされます。
- `message_sending`: `{ cancel: false }` を返すことは、上書きではなく no decision（`cancel` を省略したのと同じ）として扱われます。

### API object fields

| Field                    | Type                      | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                    |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | Plugin version（任意）                                                                       |
| `api.description`        | `string?`                 | Plugin description（任意）                                                                   |
| `api.source`             | `string`                  | Plugin source path                                                                           |
| `api.rootDir`            | `string?`                 | Plugin root directory（任意）                                                                |
| `api.config`             | `OpenClawConfig`          | 現在のconfig snapshot（利用可能な場合はアクティブなインメモリruntime snapshot）             |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からのplugin固有config                                        |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | スコープ付きlogger（`debug`, `info`, `warn`, `error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のload mode。`"setup-runtime"` は軽量なfull-entry前のstartup/setup windowです           |
| `api.resolvePath(input)` | `(string) => string`      | plugin rootからの相対pathを解決                                                              |

## Internal module規約

plugin内部では、内部importにlocal barrel fileを使ってください。

```
my-plugin/
  api.ts            # 外部consumer向けpublic exports
  runtime-api.ts    # 内部専用runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # 軽量なsetup専用entry（任意）
```

<Warning>
  production codeから自分自身のpluginを `openclaw/plugin-sdk/<your-plugin>`
  経由でimportしてはいけません。内部importは `./api.ts` または
  `./runtime-api.ts` を通してください。SDK pathは外部契約専用です。
</Warning>

Facade経由で読み込まれるbundled plugin public surface（`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`、および類似のpublic entry file）は、現在
OpenClawがすでに実行中なら、アクティブなruntime config snapshotを優先します。
まだruntime snapshotが存在しない場合は、disk上で解決されたconfig fileへフォールバックします。

provider pluginは、helperが意図的にprovider固有であり、まだ汎用SDK
subpathに属さない場合、狭いpluginローカル契約barrelを公開することもできます。現在のbundled例:
Anthropic providerは、Anthropic beta-header や `service_tier` ロジックを汎用
`plugin-sdk/*` 契約へ昇格させる代わりに、自身のpublic `api.ts` / `contract-api.ts` seamに
Claude stream helperを保持しています。

その他の現在のbundled例:

- `@openclaw/openai-provider`: `api.ts` はprovider builder、
  default-model helper、およびrealtime provider builderをexport
- `@openclaw/openrouter-provider`: `api.ts` はprovider builderと
  onboarding/config helperをexport

<Warning>
  extension production codeも、`openclaw/plugin-sdk/<other-plugin>` の
  importを避けるべきです。helperが本当に共有されるべきなら、plugin同士を結合する代わりに、
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared`、または他の
  capability指向surfaceのような中立的SDK subpathへ昇格させてください。
</Warning>

## 関連

- [Entry Points](/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry` のオプション
- [Runtime Helpers](/plugins/sdk-runtime) — 完全な `api.runtime` namespaceリファレンス
- [Setup and Config](/plugins/sdk-setup) — packaging、manifest、config schema
- [Testing](/plugins/sdk-testing) — test utilityとlint rule
- [SDK Migration](/plugins/sdk-migration) — 非推奨surfaceからの移行
- [Plugin Internals](/plugins/architecture) — 深いアーキテクチャとcapability model
