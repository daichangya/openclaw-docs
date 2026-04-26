---
read_when:
    - Plugin importに適したplugin-sdk subpathを選ぶこと
    - 同梱Pluginのsubpathとhelper surfaceを監査すること
summary: 'Plugin SDK subpath catalog: どのimportがどこにあるかを領域ごとに整理したもの'
title: Plugin SDK subpath
x-i18n:
    generated_at: "2026-04-26T11:37:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  plugin SDKは、`openclaw/plugin-sdk/` 配下の一連の狭いsubpathとして公開されています。
  このページでは、よく使われるsubpathを用途別に整理して一覧化しています。生成された
  200以上のsubpathの完全一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
  予約済みの同梱Plugin helper subpathもそこに現れますが、docページで明示的に推奨されていない限り、
  それらは実装詳細です。

  Plugin作成ガイドについては、[Plugin SDK overview](/ja-JP/plugins/sdk-overview)を参照してください。

  ## Plugin entry

  | Subpath | 主なexport |
  | ------- | ---------- |
  | `plugin-sdk/plugin-entry` | `definePluginEntry` |
  | `plugin-sdk/core` | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

  <AccordionGroup>
  <Accordion title="Channel subpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | root `openclaw.json` Zod schema export（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有setup ウィザードhelper、allowlist prompt、setup status builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチaccount config / action-gate helper、default-account fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id正規化helper |
    | `plugin-sdk/account-resolution` | account lookup + default-fallback helper |
    | `plugin-sdk/account-helpers` | 狭いaccount-list / account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | channel config schema type |
    | `plugin-sdk/telegram-command-config` | 同梱contract fallback付きのTelegram custom-command正規化 / validation helper |
    | `plugin-sdk/command-gating` | 狭いcommand authorization gate helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, draft stream lifecycle / finalization helper |
    | `plugin-sdk/inbound-envelope` | 共有inbound route + envelope builder helper |
    | `plugin-sdk/inbound-reply-dispatch` | 共有inbound record-and-dispatch helper |
    | `plugin-sdk/messaging-targets` | target parsing / matching helper |
    | `plugin-sdk/outbound-media` | 共有outbound media loading helper |
    | `plugin-sdk/outbound-send-deps` | channel adapter向けの軽量outbound send dependency lookup |
    | `plugin-sdk/outbound-runtime` | outbound delivery、identity、send delegate、session、formatting、payload planning helper |
    | `plugin-sdk/poll-runtime` | 狭いpoll正規化helper |
    | `plugin-sdk/thread-bindings-runtime` | thread-binding lifecycleおよびadapter helper |
    | `plugin-sdk/agent-media-payload` | 旧agent media payload builder |
    | `plugin-sdk/conversation-runtime` | conversation / thread binding、pairing、configured-binding helper |
    | `plugin-sdk/runtime-config-snapshot` | runtime config snapshot helper |
    | `plugin-sdk/runtime-group-policy` | runtime group-policy解決helper |
    | `plugin-sdk/channel-status` | 共有channel status snapshot / summary helper |
    | `plugin-sdk/channel-config-primitives` | 狭いchannel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | channel config-write authorization helper |
    | `plugin-sdk/channel-plugin-common` | 共有channel Plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | allowlist config edit / read helper |
    | `plugin-sdk/group-access` | 共有group-access decision helper |
    | `plugin-sdk/direct-dm` | 共有direct-DM auth / guard helper |
    | `plugin-sdk/interactive-runtime` | semantic message presentation、delivery、旧interactive reply helper。[Message Presentation](/ja-JP/plugins/message-presentation)を参照 |
    | `plugin-sdk/channel-inbound` | inbound debounce、mention matching、mention-policy helper、envelope helper向けの互換barrel |
    | `plugin-sdk/channel-inbound-debounce` | 狭いinbound debounce helper |
    | `plugin-sdk/channel-mention-gating` | より広いinbound runtime surfaceを持たない、狭いmention-policyおよびmention text helper |
    | `plugin-sdk/channel-envelope` | 狭いinbound envelope formatting helper |
    | `plugin-sdk/channel-location` | channel location contextおよびformatting helper |
    | `plugin-sdk/channel-logging` | inbound dropおよびtyping / ack failure向けchannel logging helper |
    | `plugin-sdk/channel-send-result` | reply result type |
    | `plugin-sdk/channel-actions` | channel message-action helperと、Plugin互換性のために維持されている非推奨native schema helper |
    | `plugin-sdk/channel-targets` | target parsing / matching helper |
    | `plugin-sdk/channel-contract` | channel contract type |
    | `plugin-sdk/channel-feedback` | feedback / reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、およびsecret target typeなどの狭いsecret-contract helper |
  </Accordion>

  <Accordion title="Provider subpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル / self-hosted provider setup helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換self-hosted provider setup専用helper |
    | `plugin-sdk/cli-backend` | CLI backend default + watchdog定数 |
    | `plugin-sdk/provider-auth-runtime` | provider Plugin向けruntime API-key解決helper |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などのAPI-key onboarding / profile-write helper |
    | `plugin-sdk/provider-auth-result` | 標準OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | provider Plugin向け共有interactive login helper |
    | `plugin-sdk/provider-env-vars` | provider auth env-var lookup helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有replay-policy builder、provider-endpoint helper、`normalizeNativeXaiModelId` などのmodel-id正規化helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用provider HTTP / endpoint capability helper、provider HTTP error、およびaudio transcription multipart form helper |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` と `WebFetchProviderPlugin` などの狭いweb-fetch config / selection contract helper |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider registration / cache helper |
    | `plugin-sdk/provider-web-search-config-contract` | plugin-enable wiringを必要としないprovider向けの狭いweb-search config / credential helper |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびscope付きcredential setter / getterなどの狭いweb-search config / credential contract helper |
    | `plugin-sdk/provider-web-search` | web-search provider registration / cache / runtime helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などのxAI compat helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper type、および共有Anthropic / Bedrock / DeepSeek V4 / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot wrapper helper |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message transform、writable transport event streamなどのnative provider transport helper |
    | `plugin-sdk/provider-onboard` | onboarding config patch helper |
    | `plugin-sdk/global-singleton` | process-local singleton / map / cache helper |
    | `plugin-sdk/group-activation` | 狭いgroup activation modeおよびcommand parsing helper |
  </Accordion>

  <Accordion title="authとsecurityのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、dynamic argument menu formattingを含むcommand registry helper、sender authorization helper |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのcommand / help message builder |
    | `plugin-sdk/approval-auth-runtime` | approver解決およびsame-chat action-auth helper |
    | `plugin-sdk/approval-client-runtime` | native exec approval profile / filter helper |
    | `plugin-sdk/approval-delivery-runtime` | native approval capability / delivery adapter |
    | `plugin-sdk/approval-gateway-runtime` | 共有approval gateway-resolution helper |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoint向けの軽量native approval adapter loading helper |
    | `plugin-sdk/approval-handler-runtime` | より広いapproval handler runtime helper。より狭いadapter / gateway seamで十分な場合はそちらを優先 |
    | `plugin-sdk/approval-native-runtime` | native approval target + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | exec / Plugin approval reply payload helper |
    | `plugin-sdk/approval-runtime` | exec / Plugin approval payload helper、native approval routing / runtime helper、および `formatApprovalDisplayPath` などの構造化approval display helper |
    | `plugin-sdk/reply-dedupe` | 狭いinbound reply dedupe reset helper |
    | `plugin-sdk/channel-contract-testing` | 広いtesting barrelを持たない、狭いchannel contract test helper |
    | `plugin-sdk/command-auth-native` | native command auth、dynamic argument menu formatting、およびnative session-target helper |
    | `plugin-sdk/command-detection` | 共有command detection helper |
    | `plugin-sdk/command-primitives-runtime` | hot channel path向けの軽量command text predicate |
    | `plugin-sdk/command-surface` | command-body正規化およびcommand-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel / Plugin secret surface向けの狭いsecret-contract collection helper |
    | `plugin-sdk/secret-ref-runtime` | secret-contract / config parsing向けの狭い `coerceSecretRef` とSecretRef型付けhelper |
    | `plugin-sdk/security-runtime` | 共有trust、DM gating、external-content、secret collection helper |
    | `plugin-sdk/ssrf-policy` | host allowlistおよびprivate-network SSRF policy helper |
    | `plugin-sdk/ssrf-dispatcher` | 広いinfra runtime surfaceを持たない、狭いpinned-dispatcher helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF保護付きfetch、およびSSRF policy helper |
    | `plugin-sdk/secret-input` | secret input parsing helper |
    | `plugin-sdk/webhook-ingress` | Webhook request / target helper |
    | `plugin-sdk/webhook-request-guards` | request body size / timeout helper |
  </Accordion>

  <Accordion title="runtimeとstorageのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/runtime` | 広いruntime / logging / backup / Plugin install helper |
    | `plugin-sdk/runtime-env` | 狭いruntime env、logger、timeout、retry、およびbackoff helper |
    | `plugin-sdk/channel-runtime-context` | 汎用channel runtime-context登録およびlookup helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Plugin command / hook / http / interactive helper |
    | `plugin-sdk/hook-runtime` | 共有Webhook / internal hook pipeline helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` などのlazy runtime import / binding helper |
    | `plugin-sdk/process-runtime` | process exec helper |
    | `plugin-sdk/cli-runtime` | CLI formatting、wait、version、argument invocation、およびlazy command-group helper |
    | `plugin-sdk/gateway-runtime` | Gateway clientおよびchannel-status patch helper |
    | `plugin-sdk/config-runtime` | config load / write helperおよびplugin-config lookup helper |
    | `plugin-sdk/telegram-command-config` | 同梱Telegram contract surfaceが利用できない場合でも使える、Telegram command name / description正規化およびduplicate / conflict check |
    | `plugin-sdk/text-autolink-runtime` | 広いtext-runtime barrelを持たない、file-reference autolink detection |
    | `plugin-sdk/approval-runtime` | exec / Plugin approval helper、approval-capability builder、auth / profile helper、native routing / runtime helper、および構造化approval display path formatting |
    | `plugin-sdk/reply-runtime` | 共有inbound / reply runtime helper、chunking、dispatch、Heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭いreply dispatch / finalizeおよびconversation-label helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの共有short-window reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いtext / markdown chunking helper |
    | `plugin-sdk/session-store-runtime` | session store path + updated-at helper |
    | `plugin-sdk/state-paths` | state / OAuth dir path helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` などのroute / session-key / account binding helper |
    | `plugin-sdk/status-helpers` | 共有channel / account status summary helper、runtime-state default、およびissue metadata helper |
    | `plugin-sdk/target-resolver-runtime` | 共有target resolver helper |
    | `plugin-sdk/string-normalization-runtime` | slug / string正規化helper |
    | `plugin-sdk/request-url` | fetch / request類似inputから文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化済みstdout / stderr結果を返す時間制限付きcommand runner |
    | `plugin-sdk/param-readers` | 共通tool / CLI param reader |
    | `plugin-sdk/tool-payload` | tool result objectから正規化済みpayloadを抽出 |
    | `plugin-sdk/tool-send` | tool argsからcanonical send target fieldを抽出 |
    | `plugin-sdk/temp-path` | 共有temp-download path helper |
    | `plugin-sdk/logging-core` | subsystem loggerおよびredaction helper |
    | `plugin-sdk/markdown-table-runtime` | markdown table modeおよびconversion helper |
    | `plugin-sdk/json-store` | 小さなJSON state read / write helper |
    | `plugin-sdk/file-lock` | 再入可能file-lock helper |
    | `plugin-sdk/persistent-dedupe` | disk-backed dedupe cache helper |
    | `plugin-sdk/acp-runtime` | ACP runtime / sessionおよびreply-dispatch helper |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup importなしのread-only ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | 狭いagent runtime config-schema primitive |
    | `plugin-sdk/boolean-param` | 緩いboolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | dangerous-name matching解決helper |
    | `plugin-sdk/device-bootstrap` | device bootstrapおよびpairing token helper |
    | `plugin-sdk/extension-shared` | 共有passive-channel、status、およびambient proxy helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` command / provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | Skills command listing helper |
    | `plugin-sdk/native-command-registry` | native command registry / build / serialize helper |
    | `plugin-sdk/agent-harness` | 低レベルagent harness向けの実験的trusted-plugin surface: harness type、active-run steer / abort helper、OpenClaw tool bridge helper、runtime-plan tool policy helper、terminal outcome分類、tool progress formatting / detail helper、およびattempt result utility |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint detection helper |
    | `plugin-sdk/infra-runtime` | system event / Heartbeat helper |
    | `plugin-sdk/collection-runtime` | 小さなbounded cache helper |
    | `plugin-sdk/diagnostic-runtime` | diagnostic flagおよびevent helper |
    | `plugin-sdk/error-runtime` | error graph、formatting、共有error分類helper、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | wrapped fetch、proxy、およびpinned lookup helper |
    | `plugin-sdk/runtime-fetch` | proxy / guarded-fetch importなしのdispatcher-aware runtime fetch |
    | `plugin-sdk/response-limit-runtime` | 広いmedia runtime surfaceを持たないbounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routingまたはpairing storeなしの現在のconversation binding state |
    | `plugin-sdk/session-store-runtime` | 広いconfig write / maintenance importなしのsession-store read helper |
    | `plugin-sdk/context-visibility-runtime` | 広いconfig / security importなしのcontext visibility解決およびsupplemental context filter |
    | `plugin-sdk/string-coerce-runtime` | markdown / logging importなしの狭いprimitive record / string coercionおよび正規化helper |
    | `plugin-sdk/host-runtime` | hostnameおよびSCP host正規化helper |
    | `plugin-sdk/retry-runtime` | retry configおよびretry runner helper |
    | `plugin-sdk/agent-runtime` | agent dir / identity / workspace helper |
    | `plugin-sdk/directory-runtime` | config-backed directory query / dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="capabilityとtestingのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有media fetch / transform / store helperとmedia payload builder |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの狭いmedia store helper |
    | `plugin-sdk/media-generation-runtime` | 共有media-generation failover helper、candidate selection、およびmissing-model message |
    | `plugin-sdk/media-understanding` | media understanding provider typeと、provider向けimage / audio helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text stripping、markdown render / chunking / table helper、redaction helper、directive-tag helper、安全なtext utilityなどの共有text / markdown / logging helper |
    | `plugin-sdk/text-chunking` | outbound text chunking helper |
    | `plugin-sdk/speech` | speech provider typeと、provider向けdirective、registry、validation、およびspeech helper export |
    | `plugin-sdk/speech-core` | 共有speech provider type、registry、directive、正規化、およびspeech helper export |
    | `plugin-sdk/realtime-transcription` | realtime transcription provider type、registry helper、および共有WebSocket session helper |
    | `plugin-sdk/realtime-voice` | realtime voice provider typeおよびregistry helper |
    | `plugin-sdk/image-generation` | image generation provider type |
    | `plugin-sdk/image-generation-core` | 共有image-generation type、failover、auth、およびregistry helper |
    | `plugin-sdk/music-generation` | music generation provider / request / result type |
    | `plugin-sdk/music-generation-core` | 共有music-generation type、failover helper、provider lookup、およびmodel-ref parsing |
    | `plugin-sdk/video-generation` | video generation provider / request / result type |
    | `plugin-sdk/video-generation-core` | 共有video-generation type、failover helper、provider lookup、およびmodel-ref parsing |
    | `plugin-sdk/webhook-targets` | Webhook target registryおよびroute-install helper |
    | `plugin-sdk/webhook-path` | Webhook path正規化helper |
    | `plugin-sdk/web-media` | 共有remote / local media loading helper |
    | `plugin-sdk/zod` | plugin SDK consumer向けに再exportされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="memoryのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager / config / file / CLI helper向けの同梱memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | memory index / search runtime facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding contract、registry access、local provider、および汎用batch / remote helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine export |
    | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine export |
    | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal helper |
    | `plugin-sdk/memory-core-host-query` | memory host query helper |
    | `plugin-sdk/memory-core-host-secret` | memory host secret helper |
    | `plugin-sdk/memory-core-host-events` | memory host event journal helper |
    | `plugin-sdk/memory-core-host-status` | memory host status helper |
    | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime helper |
    | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime helper |
    | `plugin-sdk/memory-core-host-runtime-files` | memory host file / runtime helper |
    | `plugin-sdk/memory-host-core` | memory host core runtime helper向けのvendor-neutral alias |
    | `plugin-sdk/memory-host-events` | memory host event journal helper向けのvendor-neutral alias |
    | `plugin-sdk/memory-host-files` | memory host file / runtime helper向けのvendor-neutral alias |
    | `plugin-sdk/memory-host-markdown` | memory隣接Plugin向けの共有managed-markdown helper |
    | `plugin-sdk/memory-host-search` | search-manager access向けのActive Memory runtime facade |
    | `plugin-sdk/memory-host-status` | memory host status helper向けのvendor-neutral alias |
    | `plugin-sdk/memory-lancedb` | 同梱memory-lancedb helper surface |
  </Accordion>

  <Accordion title="予約済み同梱helper subpath">
    | Family | 現在のsubpath | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 同梱browser Pluginのサポートhelper。`browser-profiles` は、正規化された `browser.tabCleanup` 形状向けに `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, `ResolvedBrowserTabCleanupConfig` をexportします。`browser-support` は互換barrelとして残ります。 |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 同梱Matrix helper / runtime surface |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 同梱LINE helper / runtime surface |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 同梱IRC helper surface |
    | channel固有helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 同梱channel互換 / helper seam |
    | auth / Plugin固有helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 同梱feature / Plugin helper seam。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をexportします |
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
